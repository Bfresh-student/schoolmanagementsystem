from django.db import models
from django.conf import settings


class InsightStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class InsightRequest(models.Model):
    """Stores AI-generated academic and administrative insights."""
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="ai_insights",
    )
    prompt = models.TextField()
    insight_type = models.CharField(max_length=50, default="academic_performance")
    response = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=InsightStatus.choices,
        default=InsightStatus.PENDING,
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requested_ai_insights",
    )
    synced = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Insight Request"
        verbose_name_plural = "Insight Requests"

    def __str__(self):
        return f"Insight {self.id} [{self.insight_type}] - {self.status}"
