"""
App: Gestion Inscription (Enrollment)
======================================
Représente le lien Student <-> Course, avec support offline-first
(champ `synced`, `local_uuid` pour idempotence lors du replay de la queue),
et une machine à états explicite :

    pending -> approved -> active -> (suspended) -> validated
                 \-> rejected

Toute transition de statut passe par `Inscription.transition_to()` afin
de garantir la traçabilité (AUDIT_LOG) et le déclenchement des signaux
(facturation, notifications) plutôt que par une simple assignation de
`status` suivie d'un `save()`.
"""
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class InscriptionStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    APPROVED = "approved", "Approuvée"
    ACTIVE = "active", "Active"
    SUSPENDED = "suspended", "Suspendue"
    VALIDATED = "validated", "Validée"
    REJECTED = "rejected", "Rejetée"


# Transitions autorisées (état courant -> ensemble des états suivants valides)
ALLOWED_TRANSITIONS = {
    InscriptionStatus.PENDING: {InscriptionStatus.APPROVED, InscriptionStatus.REJECTED},
    InscriptionStatus.APPROVED: {InscriptionStatus.ACTIVE, InscriptionStatus.REJECTED},
    InscriptionStatus.ACTIVE: {InscriptionStatus.SUSPENDED, InscriptionStatus.VALIDATED},
    InscriptionStatus.SUSPENDED: {InscriptionStatus.ACTIVE, InscriptionStatus.VALIDATED},
    InscriptionStatus.VALIDATED: set(),  # état terminal
    InscriptionStatus.REJECTED: set(),   # état terminal
}


class InscriptionQuerySet(models.QuerySet):
    def pending(self):
        return self.filter(status=InscriptionStatus.PENDING)

    def active(self):
        return self.filter(status=InscriptionStatus.ACTIVE)

    def unsynced(self):
        """Enregistrements créés/modifiés hors-ligne, en attente d'envoi au cloud."""
        return self.filter(synced=False)

    def for_student(self, student_id):
        return self.filter(student_id=student_id)


class Inscription(models.Model):
    # --- Identité / idempotence offline ---
    id = models.BigAutoField(primary_key=True)
    local_uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        help_text="Généré côté client au moment de la création offline. "
        "Sert de clé d'idempotence pour éviter les doublons lors du replay.",
    )

    # --- Relations principales ---
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="inscriptions"
    )
    course = models.ForeignKey(
        "courses.Course", on_delete=models.PROTECT, related_name="inscriptions"
    )

    # --- État ---
    status = models.CharField(
        max_length=20, choices=InscriptionStatus.choices, default=InscriptionStatus.PENDING
    )
    rejection_reason = models.TextField(blank=True, null=True)

    # --- Acteurs / dates métier ---
    requested_at = models.DateTimeField(default=timezone.now)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_inscriptions",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    # --- Offline-first / synchronisation ---
    synced = models.BooleanField(
        default=True,
        help_text="False tant que l'enregistrement créé/modifié en local "
        "n'a pas été confirmé par le serveur cloud.",
    )
    created_offline = models.BooleanField(default=False)

    # --- Timestamps (source de vérité pour Last-Write-Wins / conflits) ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = InscriptionQuerySet.as_manager()

    class Meta:
        db_table = "inscriptions"
        ordering = ["-requested_at"]
        constraints = [
            # Un étudiant ne peut avoir qu'UNE inscription "vivante" (non terminale)
            # par cours à la fois. Les inscriptions rejetées/validées ne comptent pas,
            # ce qui autorise une ré-inscription après un rejet ou un cursus terminé.
            models.UniqueConstraint(
                fields=["student", "course"],
                condition=models.Q(
                    status__in=[
                        InscriptionStatus.PENDING,
                        InscriptionStatus.APPROVED,
                        InscriptionStatus.ACTIVE,
                        InscriptionStatus.SUSPENDED,
                    ]
                ),
                name="uniq_active_inscription_per_student_course",
            )
        ]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["synced"]),
            models.Index(fields=["student", "course"]),
        ]

    def __str__(self):
        return f"{self.student} -> {self.course} [{self.status}]"

    # ------------------------------------------------------------------
    # Machine à états
    # ------------------------------------------------------------------
    def can_transition_to(self, new_status: str) -> bool:
        return new_status in ALLOWED_TRANSITIONS.get(self.status, set())

    def transition_to(self, new_status: str, actor=None, reason: str | None = None):
        """
        Change le statut en validant la transition, met à jour les timestamps
        métier associés, et émet le signal `inscription_status_changed`
        (consommé par les apps Finance / Notification / AI, sans couplage direct).
        """
        if not self.can_transition_to(new_status):
            raise ValidationError(
                f"Transition invalide : {self.status} -> {new_status}"
            )

        previous_status = self.status
        self.status = new_status

        now = timezone.now()
        if new_status == InscriptionStatus.APPROVED:
            self.approved_by = actor
            self.approved_at = now
        elif new_status == InscriptionStatus.ACTIVE:
            self.activated_at = now
        elif new_status == InscriptionStatus.VALIDATED:
            self.validated_at = now
        elif new_status == InscriptionStatus.REJECTED:
            self.rejection_reason = reason

        self.save(update_fields=[
            "status", "approved_by", "approved_at", "activated_at",
            "validated_at", "rejection_reason", "updated_at",
        ])

        from .signals import inscription_status_changed  # import tardif (évite cycle)
        inscription_status_changed.send(
            sender=self.__class__,
            instance=self,
            previous_status=previous_status,
            new_status=new_status,
            actor=actor,
        )
        return self
