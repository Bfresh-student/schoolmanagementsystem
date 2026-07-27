from rest_framework import serializers

from .models import Invoice, Payment, PaymentMethod, Receipt


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

    class Meta:
        model = Payment
        fields = [
            "id", "invoice", "student", "payment_method", "amount", "currency",
            "status", "gateway_reference", "synced", "created_at", "paid_at", "receipt",
        ]
        read_only_fields = ["status", "gateway_reference", "created_at", "paid_at"]


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer d'entrée pour initier un paiement. `idempotency_key` doit
    être généré côté client (UUID) et rester stable en cas de retry réseau."""

    payment_method_code = serializers.ChoiceField(choices=PaymentMethod.Code.choices, write_only=True)

    class Meta:
        model = Payment
        fields = ["invoice", "amount", "idempotency_key", "payment_method_code", "gateway_reference"]

    def validate_invoice(self, invoice):
        request = self.context["request"]
        user = request.user
        is_admin = user.is_staff or getattr(getattr(user, "role", None), "name", None) == "admin"
        if not is_admin and invoice.student.user_id != user.id:
            raise serializers.ValidationError("Cette facture ne vous appartient pas.")
        return invoice


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

    class Meta(InvoiceSerializer.Meta):
        fields = InvoiceSerializer.Meta.fields + ["payments", "notes"]
