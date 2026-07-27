import uuid

from django.core.validators import MinValueValidator
from django.db import models

from apps.students.models import Specialization
from apps.teachers.models import Teacher


class Course(models.Model):
    """
    Catalogue des formations — donnée de RÉFÉRENCE.

    Stratégie de synchronisation (cf. doc) :
    - one-way sync (cloud -> local) au démarrage de l'app locale
    - modifications autorisées UNIQUEMENT en ligne (pas de queue
      offline pour ce modèle) : le champ `synced` sert donc
      seulement à confirmer qu'une copie locale est à jour, jamais
      à empiler des écritures locales en attente.
    """

    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("active", "Actif"),
        ("archived", "Archivé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    code = models.CharField(max_length=30, unique=True, help_text="Ex: DEV-WEB-101")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    specialization = models.ForeignKey(
        Specialization, on_delete=models.PROTECT, related_name="courses"
    )
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses_taught",
        help_text="Professeur responsable du cours",
    )

    duration_weeks = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    capacity_max = models.PositiveIntegerField(
        default=30, help_text="Nombre max d'étudiants inscrits"
    )
    fees_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Montant utilisé par l'app Finance pour générer la facture",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # --- Métadonnées de synchronisation ---
    synced = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "courses"
        ordering = ["code"]
        verbose_name = "Cours"
        verbose_name_plural = "Cours"

    def __str__(self):
        return f"{self.code} — {self.name}"

    @property
    def is_active(self):
        return self.status == "active"

    @property
    def seats_taken(self):
        # 'active_inscriptions' branché sur l'app Inscription (à venir)
        return self.inscriptions.filter(
            status__in=["approved", "active"]
        ).count() if hasattr(self, "inscriptions") else 0

    @property
    def seats_available(self):
        return max(self.capacity_max - self.seats_taken, 0)


class CourseCoTeacher(models.Model):
    """
    Intervenants additionnels sur un cours (le professeur
    'responsable' est déjà porté par Course.teacher).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="co_teachers"
    )
    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE, related_name="co_taught_courses"
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "courses"
        unique_together = ("course", "teacher")
        verbose_name = "Co-intervenant"
        verbose_name_plural = "Co-intervenants"

    def __str__(self):
        return f"{self.teacher} sur {self.course}"


class CoursePrerequisite(models.Model):
    """Cours devant être validé avant de pouvoir s'inscrire à `course`."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="prerequisites"
    )
    required_course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="is_prerequisite_for"
    )

    class Meta:
        app_label = "courses"
        unique_together = ("course", "required_course")
        verbose_name = "Prérequis"
        verbose_name_plural = "Prérequis"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.course_id == self.required_course_id:
            raise ValidationError("Un cours ne peut pas être son propre prérequis.")

    def __str__(self):
        return f"{self.required_course.code} requis pour {self.course.code}"


class CourseSyllabusVersion(models.Model):
    """
    Historique des versions du syllabus (léger — le fichier lui-même
    est stocké/servi par l'app Média, ici on garde juste la référence
    et le numéro de version pour audit pédagogique).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="syllabus_versions"
    )
    version_number = models.PositiveIntegerField()
    media_file_id = models.UUIDField(
        null=True, blank=True, help_text="Référence vers MEDIA_FILES"
    )
    notes = models.TextField(blank=True)
    published_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "courses"
        unique_together = ("course", "version_number")
        ordering = ["-version_number"]
        verbose_name = "Version de syllabus"
        verbose_name_plural = "Versions de syllabus"

    def __str__(self):
        return f"{self.course.code} — v{self.version_number}"

