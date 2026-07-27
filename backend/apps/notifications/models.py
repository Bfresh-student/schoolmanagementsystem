import uuid

from django.conf import settings
from django.db import models


class NotificationChannel(models.Model):
    """email, sms, push, in_app — activable/désactivable globalement."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Canal de notification"
        verbose_name_plural = "Canaux de notification"

    def __str__(self):
        return self.name


class NotificationTrigger(models.Model):
    """
    Déclencheur métier (ex: 'grade_added', 'absence_recorded',
    'course_published', 'teacher_status_changed'...).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trigger_name = models.CharField(max_length=100, unique=True)
    template_key = models.CharField(max_length=100)
    default_priority = models.CharField(
        max_length=10,
        choices=[
            ("low", "Basse"),
            ("normal", "Normale"),
            ("high", "Haute"),
            ("urgent", "Urgente"),
        ],
        default="normal",
    )

    class Meta:
        verbose_name = "Déclencheur"
        verbose_name_plural = "Déclencheurs"

    def __str__(self):
        return self.trigger_name


class NotificationTemplate(models.Model):
    """Un template par (template_key, channel)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template_key = models.CharField(max_length=100)
    channel = models.ForeignKey(
        NotificationChannel, on_delete=models.CASCADE, related_name="templates"
    )
    subject_line = models.CharField(max_length=255, blank=True)
    content_template = models.TextField(
        help_text="Utilise la syntaxe {variable} pour l'interpolation"
    )
    variables = models.JSONField(
        default=list, blank=True, help_text="Liste des variables attendues"
    )

    class Meta:
        unique_together = ("template_key", "channel")
        verbose_name = "Template de notification"
        verbose_name_plural = "Templates de notification"

    def __str__(self):
        return f"{self.template_key} ({self.channel.name})"

    def render(self, context: dict) -> tuple[str, str]:
        """Retourne (subject, content) avec les variables interpolées."""
        safe_context = {k: v for k, v in context.items() if v is not None}
        try:
            subject = self.subject_line.format(**safe_context)
        except (KeyError, IndexError):
            subject = self.subject_line
        try:
            content = self.content_template.format(**safe_context)
        except (KeyError, IndexError):
            content = self.content_template
        return subject, content


class NotificationPreference(models.Model):
    """Préférences par utilisateur et par type de déclencheur."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )
    trigger_type = models.CharField(max_length=100)

    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=True)

    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "trigger_type")
        verbose_name = "Préférence de notification"
        verbose_name_plural = "Préférences de notification"

    def __str__(self):
        return f"{self.user} — {self.trigger_type}"

    def is_within_quiet_hours(self, at_time) -> bool:
        if not self.quiet_hours_start or not self.quiet_hours_end:
            return False
        start, end = self.quiet_hours_start, self.quiet_hours_end
        if start <= end:
            return start <= at_time <= end
        # plage à cheval sur minuit (ex: 22:00 -> 06:00)
        return at_time >= start or at_time <= end


class Notification(models.Model):
    """Notification logique (indépendante du canal d'envoi)."""

    PRIORITY_CHOICES = [
        ("low", "Basse"),
        ("normal", "Normale"),
        ("high", "Haute"),
        ("urgent", "Urgente"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    trigger = models.ForeignKey(
        NotificationTrigger,
        on_delete=models.SET_NULL,
        null=True,
        related_name="notifications",
    )
    trigger_type = models.CharField(max_length=100)

    title = models.CharField(max_length=255)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="normal")

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read"])]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.title} -> {self.recipient}"

    def mark_read(self):
        from django.utils import timezone

        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])


class NotificationQueueEntry(models.Model):
    """
    File d'envoi effective par canal. C'est ICI que vit le flag
    `synced`, car un appareil hors ligne peut empiler des entrées de
    queue en local ; l'email/SMS restent impossibles hors ligne
    (cf. doc), seule l'entrée in_app peut être marquée localement.
    """

    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("sent", "Envoyée"),
        ("failed", "Échec"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name="queue_entries"
    )
    channel = models.ForeignKey(
        NotificationChannel, on_delete=models.PROTECT, related_name="queue_entries"
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    recipient_address = models.CharField(
        max_length=255, help_text="Email, numéro de téléphone, ou device token"
    )
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)

    # --- Métadonnées de synchronisation (offline-first) ---
    synced = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Entrée de file d'envoi"
        verbose_name_plural = "Entrées de file d'envoi"

    def __str__(self):
        return f"{self.notification.title} via {self.channel.name} ({self.status})"
