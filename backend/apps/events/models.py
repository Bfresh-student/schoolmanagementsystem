import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Event(models.Model):
    """Événement scolaire (conférence, formation, cérémonie, atelier...)."""

    EVENT_TYPES = [
        ("conference", "Conférence"),
        ("training", "Formation"),
        ("ceremony", "Cérémonie"),
        ("meeting", "Réunion"),
        ("webinar", "Webinaire"),
        ("workshop", "Atelier"),
    ]
    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("published", "Publié"),
        ("ongoing", "En cours"),
        ("completed", "Terminé"),
        ("cancelled", "Annulé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)

    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)
    is_online = models.BooleanField(default=False)
    online_link = models.URLField(blank=True)

    capacity_max = models.PositiveIntegerField(
        null=True, blank=True, help_text="Laisser vide = capacité illimitée"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_events",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_datetime"]
        verbose_name = "Événement"
        verbose_name_plural = "Événements"

    def __str__(self):
        return f"{self.name} ({self.get_event_type_display()})"

    def clean(self):
        if self.end_datetime and self.start_datetime and self.end_datetime <= self.start_datetime:
            raise ValidationError(
                {"end_datetime": "La date de fin doit être après la date de début."}
            )

    @property
    def confirmed_participants_count(self):
        return self.participants.filter(status__in=["registered", "attended"]).count()

    @property
    def seats_available(self):
        if self.capacity_max is None:
            return None
        return max(self.capacity_max - self.confirmed_participants_count, 0)

    @property
    def is_full(self):
        return self.seats_available == 0

    @property
    def is_published(self):
        return self.status == "published"


class EventParticipant(models.Model):
    """
    Inscription/présence d'un utilisateur (étudiant, professeur, admin...)
    à un événement.
    """

    STATUS_CHOICES = [
        ("registered", "Inscrit"),
        ("waitlisted", "Liste d'attente"),
        ("attended", "Présent"),
        ("absent", "Absent"),
        ("cancelled", "Annulé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_participations"
    )
    registration_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="registered")
    checked_in_at = models.DateTimeField(null=True, blank=True)

    # --- Métadonnées de synchronisation (offline-first) ---
    synced = models.BooleanField(default=True)

    class Meta:
        unique_together = ("event", "user")
        ordering = ["registration_date"]
        verbose_name = "Participant"
        verbose_name_plural = "Participants"

    def __str__(self):
        return f"{self.user} -> {self.event} ({self.status})"


class EventMedia(models.Model):
    """
    Photos/vidéos liées à l'événement — fichier réel géré par l'app
    Média (référence légère par UUID pour éviter la dépendance
    circulaire entre apps).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="media_items")
    media_file_id = models.UUIDField(help_text="Référence vers MEDIA_FILES")
    caption = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name = "Média d'événement"
        verbose_name_plural = "Médias d'événement"

    def __str__(self):
        return f"Média de {self.event}"
