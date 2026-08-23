import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class PaymentMethod(models.Model):
    """Configuration des moyens de paiement disponibles (App 12 - Système Paiement)."""

    class Code(models.TextChoices):
        MONCASH = "moncash", "MonCash"
        NATCASH = "natcash", "NatCash"
        BANK_TRANSFER = "bank_transfer", "Virement bancaire"
        CASH = "cash", "Espèces"
        MOBILE_MONEY = "mobile_money", "Mobile Money"
        STRIPE = "stripe", "Carte bancaire (Stripe)"
        PAYPAL = "paypal", "PayPal"

    name = models.CharField(max_length=50)
    code = models.CharField(max_length=20, choices=Code.choices, unique=True)
    is_active = models.BooleanField(default=True)
    is_online = models.BooleanField(
        default=True,
        help_text="False pour les méthodes nécessitant une confirmation manuelle "
        "(espèces, virement) — utilisables même sans passerelle en ligne.",
    )
    # Ne jamais stocker de clés secrètes ici : uniquement des identifiants
    # publics ou des noms de variables d'environnement à résoudre côté serveur.
    public_config = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Moyen de paiement"
        verbose_name_plural = "Moyens de paiement"

    def __str__(self):
        return self.name


class Invoice(models.Model):
    """Facture générée à l'inscription (App 11 - Gestion Finance)."""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        PARTIALLY_PAID = "partially_paid", "Partiellement payée"
        PAID = "paid", "Payée"
        OVERDUE = "overdue", "En retard"
        CANCELLED = "cancelled", "Annulée"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=30, unique=True, editable=False)

    # Référence faible vers l'app "inscriptions" pour ne pas créer de
    # dépendance dure si celle-ci n'est pas encore installée.
    inscription = models.OneToOneField(
        "enrollments.Inscription",
        on_delete=models.PROTECT,
        related_name="invoice",
        null=True,
        blank=True,
    )
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="invoices",
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="HTG")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    due_date = models.DateField()
    issued_at = models.DateTimeField(default=timezone.now)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["student", "status"]),
        ]

    def __str__(self):
        return self.invoice_number

    @property
    def balance_due(self):
        return self.amount - self.amount_paid

    @property
    def is_overdue(self):
        return self.status not in (self.Status.PAID, self.Status.CANCELLED) and self.due_date < timezone.now().date()

    def recompute_status(self, save=True):
        """Recalcule le statut à partir des paiements complétés. Appelé après
        chaque paiement réussi et par la tâche périodique de détection des retards.

        BUG CORRIGÉ : l'ancienne condition était
            if self.amount_paid >= self.amount and self.amount > 0:
        Le `and self.amount > 0` excluait explicitement les factures à
        0.00 HTG (formation gratuite, ex. une SchoolClass avec
        tuition_fee=0.00) : `0 >= 0` est vrai, mais `0 > 0` est faux, donc
        la condition entière échouait et la facture restait bloquée en
        PENDING pour toujours, même si rien n'est dû (balance_due=0).
        On retire ce garde-fou : une facture dont amount_paid >= amount
        est réglée, que le montant total soit 0 ou non — sémantiquement
        correct dans les deux cas.
        """
        if self.amount_paid >= self.amount:
            self.status = self.Status.PAID
        elif self.amount_paid > 0:
            self.status = self.Status.PARTIALLY_PAID
        elif self.is_overdue:
            self.status = self.Status.OVERDUE
        else:
            self.status = self.Status.PENDING
        if save:
            self.save(update_fields=["status", "amount_paid", "updated_at"])


class Payment(models.Model):
    """Enregistrement d'un paiement (App 12 - Système Paiement)."""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        PROCESSING = "processing", "En cours"
        COMPLETED = "completed", "Complété"
        FAILED = "failed", "Échoué"
        REFUNDED = "refunded", "Remboursé"
        CANCELLED = "cancelled", "Annulé"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="payments")
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="payments")
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT, related_name="payments")

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="HTG")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Référence renvoyée par la passerelle (Stripe PaymentIntent id, PayPal
    # order id, transaction Mobile Money, n° de virement...).
    gateway_reference = models.CharField(max_length=255, blank=True, db_index=True)
    # Empêche la double soumission d'un même paiement (saisi hors-ligne
    # notamment) : clé générée automatiquement à la création, unique.
    # default=uuid.uuid4 (callable) garantit qu'aucune création ne peut
    # laisser ce champ vide ("") et provoquer une IntegrityError sur la
    # deuxième ligne créée sans valeur explicite.
    idempotency_key = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)

    failure_reason = models.TextField(blank=True)

    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="payments_initiated"
    )

    # Flag de synchronisation offline-first : un paiement en espèces peut être
    # saisi localement par un admin, puis remonté au serveur central.
    synced = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["synced"]),
        ]

    def __str__(self):
        return f"{self.id} ({self.get_status_display()})"


class Receipt(models.Model):
    """Reçu PDF généré après un paiement complété."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.OneToOneField(Payment, on_delete=models.PROTECT, related_name="receipt")
    receipt_number = models.CharField(max_length=30, unique=True, editable=False)
    pdf_path = models.CharField(max_length=500, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Reçu"
        verbose_name_plural = "Reçus"

    def __str__(self):
        return self.receipt_number


class WebhookEvent(models.Model):
    """Journal des événements webhook reçus des passerelles, pour garantir
    l'idempotence (un même événement Stripe/PayPal ne doit être traité qu'une fois).

    NOTE : conservé pour compatibilité historique / audit, mais le flux de
    paiement actuel (100% saisie manuelle) n'écrit plus dans cette table —
    voir le commentaire en tête de services.py.
    """

    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        PAYPAL = "paypal", "PayPal"
        MOBILE_MONEY = "mobile_money", "Mobile Money"

    provider = models.CharField(max_length=20, choices=Provider.choices)
    external_event_id = models.CharField(max_length=255)
    payload = models.JSONField()
    processed = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Événement Webhook"
        verbose_name_plural = "Événements Webhook"
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "external_event_id"], name="uniq_provider_event"
            )
        ]

    def __str__(self):
        return f"{self.provider}:{self.external_event_id}"