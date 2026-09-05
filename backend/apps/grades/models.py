"""
App: Gestion Note (Grades)
============================
LE cas critique de synchronisation du document : deux acteurs (prof offline,
admin online) peuvent saisir une note différente pour le MÊME couple
(student, course). Comme `Grade` porte une contrainte UNIQUE (student, course),
on ne peut pas stocker deux notes concurrentes dans la même table.

Architecture retenue (Queue + Conflict Detection, cf. tableau comparatif du
document — écarté : Last-Write-Wins pur, car "perte de données possible" y
est explicitement listé comme inacceptable pour des notes) :

    Grade            -> source de vérité, UNE ligne par (student, course)
    GradeSyncEntry    -> staging : une soumission (locale OU distante) en
                         attente d'application ; conserve son propre
                         timestamp pour comparaison
    GradeConflict     -> créée dès que deux valeurs DIFFÉRENTES existent
                         pour le même (student, course) ; résolution
                         TOUJOURS manuelle par un admin (jamais d'auto-LWW
                         silencieux sur une note).
"""
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class Assessment(models.Model):
    """Évaluation pondérée d'un cours pour une classe et une période."""

    class Type(models.TextChoices):
        QUIZ = "quiz", "Quiz"
        ASSIGNMENT = "assignment", "Devoir"
        EXAM = "exam", "Examen"
        PROJECT = "project", "Projet"
        ORAL = "oral", "Oral"

    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE, related_name="assessments")
    school_class = models.ForeignKey("students.SchoolClass", on_delete=models.PROTECT, related_name="assessments")
    academic_year = models.ForeignKey(
        "students.AcademicYear",
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="assessments",
        to_field="label",
        help_text="Année académique (ex: 2025-2026)",
    )
    term = models.CharField(max_length=80, blank=True)
    title = models.CharField(max_length=150)
    evaluation_type = models.CharField(max_length=20, choices=Type.choices, default=Type.ASSIGNMENT)
    coefficient = models.DecimalField(max_digits=5, decimal_places=2, default=1, validators=[MinValueValidator(0.01)])
    evaluation_date = models.DateField(default=timezone.now)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-evaluation_date", "title"]
        constraints = [models.UniqueConstraint(fields=["course", "school_class", "academic_year", "term", "title"], name="uniq_assessment_per_period")]

    def __str__(self):
        return f"{self.course} — {self.title} ({self.academic_year})"


class Grade(models.Model):
    """Source de vérité : LA note actuelle d'un étudiant pour un cours."""

    id = models.BigAutoField(primary_key=True)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="grades")
    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE, related_name="grades")
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name="grades", null=True, blank=True)
    teacher = models.ForeignKey(
        "teachers.Teacher", on_delete=models.SET_NULL, null=True, related_name="grades_given"
    )

    value = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    date_graded = models.DateField(default=timezone.now)

    # Offline-first
    synced = models.BooleanField(default=True)

    # Timestamps -> comparaison lors de la détection de conflit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "grades"
        db_table = "grades"
        constraints = [
            models.UniqueConstraint(fields=["student", "assessment"], name="uniq_grade_per_student_assessment"),
            models.CheckConstraint(
                condition=models.Q(value__gte=0) & models.Q(value__lte=100),
                name="grade_value_between_0_and_100",
            ),
        ]
        indexes = [
            models.Index(fields=["synced"]),
            models.Index(fields=["student", "assessment"]),
        ]

    def __str__(self):
        return f"{self.student} / {self.course} = {self.value}"


class SyncEntryStatus(models.TextChoices):
    PENDING = "pending", "En attente de traitement"
    APPLIED = "applied", "Appliquée sans conflit"
    CONFLICT = "conflict", "En conflit"
    DISCARDED = "discarded", "Écartée (doublon idempotent)"


class GradeSyncEntry(models.Model):
    """
    Une soumission individuelle de note, avant fusion dans `Grade`.

    Créée :
      - côté client à la saisie offline (source='local'), envoyée au sync manager
        à la reconnexion ;
      - ou directement côté serveur à la saisie online (source='remote'),
        pour garder une trace uniforme et un historique complet des saisies.
    """

    class Source(models.TextChoices):
        LOCAL = "local", "Saisie hors-ligne"
        REMOTE = "remote", "Saisie en ligne"

    id = models.BigAutoField(primary_key=True)
    local_uuid = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False,
        help_text="Clé d'idempotence : évite qu'un replay réseau ne crée deux entrées.",
    )

    student = models.ForeignKey("students.Student", on_delete=models.CASCADE)
    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, null=True, blank=True)
    teacher = models.ForeignKey("teachers.Teacher", on_delete=models.SET_NULL, null=True)

    value = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    source = models.CharField(max_length=10, choices=Source.choices)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    # Timestamp métier : quand la note a été saisie (côté client si offline),
    # PAS quand l'entrée a été insérée en base (created_at le fait déjà).
    local_timestamp = models.DateTimeField(
        help_text="Horodatage de la saisie effective, tel que capturé sur l'appareil du prof."
    )

    status = models.CharField(max_length=12, choices=SyncEntryStatus.choices, default=SyncEntryStatus.PENDING)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "grades"
        db_table = "grade_sync_entries"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(value__gte=0) & models.Q(value__lte=100),
                name="grade_sync_value_between_0_and_100",
            ),
        ]
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return f"[{self.source}] {self.student} / {self.course} = {self.value} ({self.status})"


class GradeConflict(models.Model):
    """
    Créée quand une `GradeSyncEntry` arrive alors qu'un `Grade` existant a
    une valeur DIFFÉRENTE. Toujours résolue manuellement (cf. justification
    en tête de fichier).
    """

    class Resolution(models.TextChoices):
        LOCAL = "local", "Garder la version locale"
        REMOTE = "remote", "Garder la version distante"
        MANUAL = "manual_merge", "Valeur saisie manuellement par l'admin"

    id = models.BigAutoField(primary_key=True)
    sync_entry = models.OneToOneField(GradeSyncEntry, on_delete=models.CASCADE, related_name="conflict")
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name="conflicts")

    local_version = models.JSONField(help_text="Snapshot de la valeur en attente (l'entrée en conflit).")
    remote_version = models.JSONField(help_text="Snapshot de la valeur actuellement en base.")

    resolution_choice = models.CharField(max_length=15, choices=Resolution.choices, null=True, blank=True)
    resolved_value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "grades"
        db_table = "grade_conflicts"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(resolved_value__gte=0) & models.Q(resolved_value__lte=100),
                name="resolved_grade_value_between_0_and_100",
            ),
        ]
        indexes = [models.Index(fields=["resolution_choice"])]

    @property
    def is_resolved(self):
        return self.resolution_choice is not None

    def resolve(self, choice: str, actor, manual_value=None):
        if self.is_resolved:
            raise ValidationError("Ce conflit a déjà été résolu.")

        if choice == self.Resolution.LOCAL:
            final_value = self.local_version["value"]
        elif choice == self.Resolution.REMOTE:
            final_value = self.remote_version["value"]
        elif choice == self.Resolution.MANUAL:
            if manual_value is None:
                raise ValidationError("Une valeur manuelle est requise pour ce choix.")
            final_value = manual_value
        else:
            raise ValidationError("Choix de résolution invalide.")

        self.resolution_choice = choice
        self.resolved_value = final_value
        self.resolved_by = actor
        self.resolved_at = timezone.now()
        self.save(update_fields=["resolution_choice", "resolved_value", "resolved_by", "resolved_at"])

        self.grade.value = final_value
        self.grade.synced = True
        self.grade.save(update_fields=["value", "synced", "updated_at"])

        self.sync_entry.status = SyncEntryStatus.APPLIED
        self.sync_entry.save(update_fields=["status"])

        from .signals import grade_conflict_resolved
        grade_conflict_resolved.send(sender=self.__class__, conflict=self, actor=actor)

        return self.grade
