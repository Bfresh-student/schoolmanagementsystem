from rest_framework import serializers

from .models import Invoice, Payment, PaymentMethod, Receipt
from .permissions import _is_admin
from .services import PaymentError, PaymentService


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ["id", "name", "code", "is_active", "is_online"]


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ["id", "receipt_number", "pdf_path", "generated_at"]


class PaymentSerializer(serializers.ModelSerializer):
    receipt = ReceiptSerializer(read_only=True)
    payment_method = PaymentMethodSerializer(read_only=True)

    reference = serializers.CharField(source="gateway_reference", read_only=True)
    class Meta:
        model = Payment
        fields = [
            "id", "invoice", "student", "payment_method", "amount", "currency",
            "status", "synced", "created_at", "paid_at", "receipt", "reference",
        ]
        read_only_fields = ["status", "created_at", "paid_at"]


class PaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer d'entrée pour enregistrer un paiement manuel (espèces,
    virement, MonCash/NatCash physiquement constaté).

    ⚠️ CHANGEMENT par rapport à l'ancien flux passerelle :
      - `payment_method` est maintenant l'ID d'un PaymentMethod existant
        (récupéré via GET /finance/payment-methods/), et non plus un
        `payment_method_code` en écriture seule couplé à Stripe/PayPal.
      - `idempotency_key` et `gateway_reference` ont disparu : ils
        n'avaient de sens que pour dédupliquer les retries réseau d'une
        passerelle externe. La déduplication n'est plus nécessaire ici
        puisque le staff saisit le paiement en personne, en une fois.
    """

    reference = serializers.CharField(
        source="gateway_reference",
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=255,
        error_messages={"required": "La référence de transaction est obligatoire.", "blank": "La référence de transaction est obligatoire."},
    )
    payment_date = serializers.DateField(required=False, write_only=True)

    class Meta:
        model = Payment
        fields = ["invoice", "payment_method", "amount", "reference", "payment_date"]

    def validate_invoice(self, invoice):
        request = self.context["request"]
        user = request.user
        # Utilise la même logique que permissions.py (_is_admin), plutôt
        # que de la redéfinir ici : c'est exactement cette duplication qui
        # avait causé le bug précédent (role.name sur une string au lieu
        # d'une comparaison directe).
        if not _is_admin(user) and invoice.student.user_id != user.id:
            raise serializers.ValidationError("Cette facture ne vous appartient pas.")
        return invoice

    def validate_payment_method(self, payment_method):
        if not payment_method.is_active:
            raise serializers.ValidationError("Ce moyen de paiement est désactivé.")
        # Seuls les moyens is_online=True (Stripe, PayPal) sont refusés :
        # MonCash, NatCash, Virement et Espèces sont tous is_online=False
        # et donc acceptés ici (paiements confirmés manuellement par l'agent).
        if getattr(payment_method, "is_online", False):
            raise serializers.ValidationError(
                "Les passerelles de paiement automatiques ne sont pas prises en charge — "
                "sélectionnez un moyen de paiement manuel (MonCash, NatCash, virement, espèces)."
            )
        return payment_method

    def create(self, validated_data):
        """
        BUG CORRIGÉ — LE bug racine du "montant payé reste à 0" :
        cette méthode create() n'existait pas du tout avant. Sans elle,
        DRF utilisait le create() par défaut de ModelSerializer, qui fait
        un simple `Payment.objects.create(**validated_data)` :
          - `student` n'est même pas dans Meta.fields (donc absent de
            validated_data) alors que Payment.student est un ForeignKey
            obligatoire -> IntegrityError potentielle selon comment le
            ViewSet appelle perform_create().
          - Et surtout : invoice.amount_paid n'était JAMAIS incrémenté,
            invoice.recompute_status() n'était JAMAIS appelé, le paiement
            restait au statut PENDING par défaut (au lieu de COMPLETED),
            et aucun reçu n'était généré — toute cette logique vit
            uniquement dans PaymentService.record_manual(), qui n'était
            jamais invoqué.
        On délègue donc explicitement au service, qui est la seule source
        de vérité pour "qu'est-ce qui se passe quand un paiement est
        enregistré".
        """
        request = self.context["request"]
        payment_date = validated_data.pop("payment_date", None)
        try:
            return PaymentService.record_manual(
                invoice=validated_data["invoice"],
                payment_method=validated_data["payment_method"],
                amount=validated_data["amount"],
                user=request.user,
                reference=validated_data.get("gateway_reference", ""),
                paid_at=payment_date,
            )
        except PaymentError as exc:
            raise serializers.ValidationError({"amount": str(exc)})


class InvoiceSerializer(serializers.ModelSerializer):
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "invoice_number", "student", "inscription", "amount", "amount_paid",
            "currency", "status", "due_date", "issued_at", "balance_due", "is_overdue",
            "created_at", "updated_at",
        ]
        read_only_fields = ["invoice_number", "amount_paid", "status", "issued_at"]


class InvoiceDetailSerializer(InvoiceSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    notes = serializers.CharField(read_only=True)

    class Meta(InvoiceSerializer.Meta):
        fields = InvoiceSerializer.Meta.fields + ["payments", "notes"]
