from django.db import models
from decimal import Decimal
from django.core.validators import MinValueValidator
from django.conf import settings


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class PaymentMethod(models.TextChoices):
    CREDIT_CARD = "credit_card", "Credit Card"
    BANK_TRANSFER = "bank_transfer", "Bank Transfer"
    CASH = "cash", "Cash"
    OTHER = "other", "Other"


class Payment(models.Model):
    """Core payment record for tuition, fees, etc."""
    # Basic identifiers
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="direct_payments",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    currency = models.CharField(
        max_length=3,
        choices=settings.CURRENCY_CHOICES if hasattr(settings, "CURRENCY_CHOICES") else [("HTG", "Gourde haïtienne"), ("USD", "Dollar américain")],
        default="HTG",
    )
    # Transaction details
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.OTHER,
    )
    transaction_id = models.CharField(max_length=255, blank=True)
    receipt_file = models.FileField(upload_to="payments/receipts/", null=True, blank=True)
    # Sync metadata
    synced = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("student", "transaction_id")

    def __str__(self):
        return f"Payment {self.id} – {self.student} – {self.amount} {self.currency}" 
