import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.courses.models import Course
from apps.teachers.models import Teacher

# ---------------------------------------------------------------------------
# NOTE SUR LES RÉFÉRENCES ÉTUDIANT
# ---------------------------------------------------------------------------
# L'app 'students' est développée séparément et son schéma exact n'est pas
# disponible ici. Toutes les références à un étudiant utilisent donc un
# simple UUIDField (`student_id`) plutôt qu'une ForeignKey typée, pour éviter
# toute dépendance circulaire ou schéma incompatible. À remplacer par une
# vraie FK (`models.ForeignKey('students.Student', ...)`) dès que le nom
# exact de l'app/modèle est connu.
# ---------------------------------------------------------------------------


class Project(models.Model):
    """Projet pédagogique de groupe, rattaché à un cours."""

    STATUS_CHOICES = [
        ("planning", "Planification"),
        ("in_progress", "En cours"),
        ("completed", "Terminé"),
        ("evaluated", "Évalué"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="projects")
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supervised_projects",
        help_text="Superviseur du projet",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planning")
    final_grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Projet"
        verbose_name_plural = "Projets"

    def __str__(self):
        return self.name

    @property
    def members_count(self):
        return self.members.count()


class ProjectMember(models.Model):
    """Participation d'un étudiant à un projet."""

    ROLE_CHOICES = [
        ("leader", "Chef de projet"),
        ("member", "Membre"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="members")
    student_id = models.UUIDField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    contribution = models.TextField(blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "student_id")
        verbose_name = "Membre de projet"
        verbose_name_plural = "Membres de projet"

    def __str__(self):
        return f"{self.student_id} sur {self.project} ({self.role})"


class ProjectDeliverable(models.Model):
    """Rendu attendu pour un projet (fichier, notation)."""

    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("submitted", "Soumis"),
        ("late", "En retard"),
        ("graded", "Noté"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="deliverables"
    )
    name = models.CharField(max_length=255)
    due_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    file_path = models.CharField(max_length=500, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by_student_id = models.UUIDField(null=True, blank=True)

    grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
    )
    feedback = models.TextField(blank=True)

    # --- Sync (documents = lazy sync, pas d'auto-sync des gros fichiers) ---
    synced = models.BooleanField(default=True)

    class Meta:
        ordering = ["due_date"]
        verbose_name = "Livrable de projet"
        verbose_name_plural = "Livrables de projet"

    def __str__(self):
        return f"{self.name} ({self.project})"

    @property
    def is_late(self):
        from django.utils import timezone

        return self.status == "pending" and self.due_date < timezone.now()


class Company(models.Model):
    """Entreprise hôte pour les stages."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    sector = models.CharField(max_length=150, blank=True)
    address = models.CharField(max_length=500, blank=True)
    contact_name = models.CharField(max_length=150, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Entreprise"
        verbose_name_plural = "Entreprises"

    def __str__(self):
        return self.name


class Internship(models.Model):
    """Stage professionnel en entreprise."""

    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("ongoing", "En cours"),
        ("completed", "Terminé"),
        ("terminated", "Interrompu"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.UUIDField()
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="internships")
    mentor = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mentored_internships",
    )

    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    final_grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
    )
    certificate_path = models.CharField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "Stage"
        verbose_name_plural = "Stages"

    def __str__(self):
        return f"Stage {self.student_id} @ {self.company}"


class InternshipLog(models.Model):
    """Journal quotidien du stagiaire."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    internship = models.ForeignKey(
        Internship, on_delete=models.CASCADE, related_name="logs"
    )
    log_date = models.DateField()
    daily_activities = models.TextField()
    challenges = models.TextField(blank=True)

    # --- Sync (saisi potentiellement offline par l'étudiant en entreprise) ---
    synced = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("internship", "log_date")
        ordering = ["-log_date"]
        verbose_name = "Journal de stage"
        verbose_name_plural = "Journaux de stage"

    def __str__(self):
        return f"{self.internship} — {self.log_date}"


class Mentorship(models.Model):
    """Relation de mentorat entre un étudiant et un professeur."""

    STATUS_CHOICES = [
        ("active", "Actif"),
        ("paused", "En pause"),
        ("completed", "Terminé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.UUIDField()
    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE, related_name="mentorships"
    )
    start_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    objectives = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "Mentorat"
        verbose_name_plural = "Mentorats"

    def __str__(self):
        return f"{self.student_id} <-> {self.teacher}"


class MentorshipSession(models.Model):
    """Séance individuelle de mentorat."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentorship = models.ForeignKey(
        Mentorship, on_delete=models.CASCADE, related_name="sessions"
    )
    session_date = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    notes = models.TextField(blank=True)
    feedback = models.TextField(blank=True)

    synced = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-session_date"]
        verbose_name = "Séance de mentorat"
        verbose_name_plural = "Séances de mentorat"

    def __str__(self):
        return f"{self.mentorship} — {self.session_date:%Y-%m-%d}"


class BusinessPlan(models.Model):
    """Projet entrepreneurial d'un étudiant."""

    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("submitted", "Soumis"),
        ("under_review", "En évaluation"),
        ("approved", "Approuvé"),
        ("rejected", "Rejeté"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.UUIDField()
    business_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    financial_projection = models.JSONField(
        default=dict, blank=True, help_text="Projections chiffrées (revenus, coûts...)"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    final_grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Business Plan"
        verbose_name_plural = "Business Plans"

    def __str__(self):
        return self.business_name


class BusinessPlanPresentation(models.Model):
    """Soutenance/présentation évaluée d'un business plan."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business_plan = models.ForeignKey(
        BusinessPlan, on_delete=models.CASCADE, related_name="presentations"
    )
    presentation_date = models.DateTimeField()
    score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
    )
    evaluator = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL, null=True, blank=True
    )
    evaluator_comments = models.TextField(blank=True)

    class Meta:
        ordering = ["-presentation_date"]
        verbose_name = "Présentation de Business Plan"
        verbose_name_plural = "Présentations de Business Plan"

    def __str__(self):
        return f"{self.business_plan} — {self.presentation_date:%Y-%m-%d}"
