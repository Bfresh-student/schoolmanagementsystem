import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class AcademicYear(models.Model):
    """Année académique de référence (ex: 2025-2026)."""
    label = models.CharField(max_length=9, unique=True, help_text="Format: AAAA-AAAA")
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "Année académique"
        verbose_name_plural = "Années académiques"

    def __str__(self):
        return self.label

    def save(self, *args, **kwargs):
        # Une seule année active à la fois
        if self.is_active:
            AcademicYear.objects.exclude(pk=self.pk).filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)


class Specialization(models.Model):
    """
    Filière de formation (ex: Informatique, Commerce).

    NOTE: Ce modèle vit ici temporairement. Quand l'app "courses"
    (Gestion Cours) sera créée, il faudra:
      1. Créer une migration de données pour déplacer la table
      2. `makemigrations --empty students` pour supprimer le modèle ici
      3. Mettre à jour le FK dans Student vers 'courses.Specialization'
    """

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Spécialisation"
        verbose_name_plural = "Spécialisations"
        app_label = "students"

    def __str__(self):
        return self.name


 
# ============================================================================
# NOUVEAU : SchoolClass
# ============================================================================
class SchoolClass(models.Model):
    '''
    Une "classe" = un niveau au sein d'une filière (ex: "Entrepreneuriat 1").
    Persiste d'une année sur l'autre : chaque nouvelle cohorte d'élèves est
    simplement assignée à une classe existante via Student.school_class.
    Le suivi de l'année académique se fait séparément (registration_number /
    enrollment_date sur Student), pas ici.
    '''
 
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150, blank=True)  # auto-généré si vide
    specialization = models.ForeignKey(
        Specialization,
        on_delete=models.CASCADE,
        related_name="classes",
    )
    level = models.PositiveSmallIntegerField(default=1)  # niveau/année : 1, 2, 3...
    room = models.CharField(max_length=50, blank=True)
    capacity = models.PositiveSmallIntegerField(default=30)
    tuition_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Frais de scolarité pour cette classe. Utilisé pour générer la facture à l'inscription.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        ordering = ["specialization__name", "level"]
        unique_together = ("specialization", "level")
        verbose_name = "Classe"
        verbose_name_plural = "Classes"
        app_label = "students"
 
    def __str__(self):
        return self.name or f"{self.specialization.name} {self.level}"
 
    def save(self, *args, **kwargs):
        if not self.name and self.specialization_id:
            self.name = f"{self.specialization.name} {self.level}"
        super().save(*args, **kwargs)
 

class Student(models.Model):
    """
    Profil étudiant, lié 1:1 à USERS.

    Contient les données sensibles (naissance, adresse, contacts
    d'urgence) -> accès restreint via permissions RBAC (voir permissions.py).
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Actif"
        SUSPENDED = "suspended", "Suspendu"
        GRADUATED = "graduated", "Diplômé"
        WITHDRAWN = "withdrawn", "Abandon"

    id = models.BigAutoField(primary_key=True)

    # Relation 1:1 vers USERS (foundation)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )

    # Identifiant métier unique, ex: "PROF-2024-001"
    registration_number = models.CharField(max_length=30, editable=False)

    specialization = models.ForeignKey(
        Specialization,
        on_delete=models.PROTECT,
        related_name="students",
        null=True,
        blank=True,
    )
    
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.PROTECT,
        related_name="students",
        null=True,
        blank=True,
    )

    # --- Données sensibles ---
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    # Liste de contacts: [{"name": "...", "relationship": "...", "phone": "..."}]
    emergency_contacts = models.JSONField(default=list, blank=True)

    enrollment_date = models.DateField(auto_now_add=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    is_active = models.BooleanField(default=True)

    # --- Métadonnées de synchronisation (offline-first) ---
    synced = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Élève"
        verbose_name_plural = "Élèves"
        app_label = "students"
        indexes = [
            models.Index(fields=["registration_number"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.registration_number} - {self.user.get_full_name() or self.user.email}"

    def clean(self):
        for contact in self.emergency_contacts:
            if not isinstance(contact, dict) or not contact.get("phone"):
                raise ValidationError(
                    "Chaque contact d'urgence doit contenir au moins un champ 'phone'."
                )

    def save(self, *args, **kwargs):
        if not self.registration_number:
            self.registration_number = self._generate_registration_number()
        super().save(*args, **kwargs)

    def _generate_registration_number(self):
        """Génère un numéro du type PROF-2024-000123."""
        year = self.enrollment_date.year if self.enrollment_date else uuid.uuid1().time
        from django.utils import timezone

        current_year = timezone.now().year
        last = (
            Student.objects.filter(registration_number__startswith=f"PROF-{current_year}-")
            .order_by("-id")
            .first()
        )
        next_number = 1
        if last:
            try:
                next_number = int(last.registration_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                next_number = last.id + 1
        return f"PROF-{current_year}-{next_number:06d}"

    def anonymize(self):
        """
        Anonymisation RGPD ("droit à l'oubli").
        Les notes/présences liées sont conservées (obligation légale)
        mais ne référencent plus l'identité réelle de l'étudiant.
        """
        self.address = ""
        self.emergency_contacts = []
        self.date_of_birth = None
        self.is_active = False
        self.status = self.Status.WITHDRAWN
        self.save(update_fields=[
            "address", "emergency_contacts", "date_of_birth",
            "is_active", "status", "updated_at",
        ])

        self.user.email = f"deleted_{self.id}@deleted.local"
        self.user.first_name = "DELETED"
        self.user.last_name = "DELETED"
        self.user.is_active = False
        self.user.save(update_fields=[
            "email", "first_name", "last_name", "is_active",
        ])