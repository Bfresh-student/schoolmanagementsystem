"""
App Gestion RH.

Hypothèses d'intégration (à ajuster si tes noms d'app diffèrent) :
- L'app "Gestion Professeur" existe déjà et expose un modèle `Teacher`
  dans une app nommée `teachers` (import via string : "teachers.Teacher").
- Le modèle User custom est celui configuré dans settings.AUTH_USER_MODEL
  (app "Gestion Utilisateur"), utilisé pour approver_id / evaluator_id / admin_id.

Cette app ne dépend que de Teachers et Users. Aucune autre app ne doit
avoir de FK vers les modèles ci-dessous (RH est une "feuille" du graphe
de dépendances, cf. spec).
"""

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


# ---------------------------------------------------------------------------
# Choices
# ---------------------------------------------------------------------------

class ContractType(models.TextChoices):
    PERMANENT = "permanent", "Permanent"
    TEMPORARY = "temporary", "Temporaire"
    PART_TIME = "part_time", "Temps partiel"
    CONSULTANT = "consultant", "Consultant"


class ContractStatus(models.TextChoices):
    DRAFT = "draft", "Brouillon"
    ACTIVE = "active", "Actif"
    EXPIRED = "expired", "Expiré"
    TERMINATED = "terminated", "Résilié"


class Currency(models.TextChoices):
    HTG = "HTG", "Gourde haïtienne"
    USD = "USD", "Dollar américain"


class SalaryStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    PROCESSING = "processing", "En cours de traitement"
    PAID = "paid", "Payé"
    BOUNCED = "bounced", "Rejeté"
    CANCELLED = "cancelled", "Annulé"


class LeaveStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    APPROVED = "approved", "Approuvé"
    REJECTED = "rejected", "Rejeté"
    CANCELLED = "cancelled", "Annulé"


class EvaluationType(models.TextChoices):
    ANNUAL = "annual", "Annuelle"
    PROBATION = "probation", "Fin de période d'essai"
    DISCIPLINARY = "disciplinary", "Disciplinaire"
    AD_HOC = "ad_hoc", "Ponctuelle"


class HRDocumentType(models.TextChoices):
    DIPLOMA = "diploma", "Diplôme"
    CERTIFICATION = "certification", "Certification"
    LICENSE = "license", "Licence d'enseignement"
    ID_CARD = "id_card", "Pièce d'identité"
    CV = "cv", "CV"
    OTHER = "other", "Autre"


class HRDocumentStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    VALID = "valid", "Valide"
    EXPIRING_SOON = "expiring_soon", "Expire bientôt"
    EXPIRED = "expired", "Expiré"


class AuditAction(models.TextChoices):
    CREATE = "create", "Création"
    UPDATE = "update", "Modification"
    DELETE = "delete", "Suppression"
    APPROVE = "approve", "Approbation"
    REJECT = "reject", "Rejet"


class AuditEntityType(models.TextChoices):
    EMPLOYEE = "employee", "Employé"
    CANDIDATE = "candidate", "Candidat"
    ATTENDANCE = "attendance", "Présence"
    CONTRACT = "contract", "Contrat"
    SALARY = "salary", "Salaire"
    LEAVE = "leave", "Congé"
    EVALUATION = "evaluation", "Évaluation"
    HR_DOCUMENT = "hr_document", "Document RH"


# ---------------------------------------------------------------------------
# LeaveType
# ---------------------------------------------------------------------------

class LeaveType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    days_per_year = models.DecimalField(max_digits=5, decimal_places=2)
    is_paid = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Personnel administratif et recrutement
# ---------------------------------------------------------------------------

class EmployeeStatus(models.TextChoices):
    ACTIVE = "active", "Actif"
    SUSPENDED = "suspended", "Suspendu"
    INACTIVE = "inactive", "Inactif"
    TERMINATED = "terminated", "Fin de contrat"


class Employee(models.Model):
    """Fiche RH persistante des collaborateurs hors app Teachers."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="employee_profile")
    employee_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    gender = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    job_title = models.CharField(max_length=150)
    department = models.CharField(max_length=150)
    hire_date = models.DateField()
    status = models.CharField(max_length=20, choices=EmployeeStatus.choices, default=EmployeeStatus.ACTIVE)
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    monthly_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_number})"


class CandidateStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    INTERVIEW = "interview", "Entretien"
    SELECTED = "selected", "Sélectionné"
    REJECTED = "rejected", "Rejeté"
    HIRED = "hired", "Embauché"


class Candidate(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField()
    position = models.CharField(max_length=150)
    application_date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, choices=CandidateStatus.choices, default=CandidateStatus.PENDING)
    interview_date = models.DateField(null=True, blank=True)
    interview_time = models.TimeField(null=True, blank=True)
    interviewer = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)
    cv_file = models.FileField(upload_to="hr/candidates/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-application_date", "last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.position}"


class CandidateDocument(models.Model):
    """Pièce déposée dans le dossier d'un postulant avant son embauche."""

    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=20, choices=HRDocumentType.choices, default=HRDocumentType.OTHER)
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to="hr/candidates/documents/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.filename} — {self.candidate}"


class AttendanceStatus(models.TextChoices):
    PRESENT = "present", "Présent"
    LATE = "late", "Retard"
    ABSENT = "absent", "Absent"
    EXCUSED = "excused", "Absence justifiée"


class EmployeeAttendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField(default=timezone.localdate)
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "employee__last_name"]
        constraints = [models.UniqueConstraint(fields=["employee", "date"], name="hr_one_attendance_per_employee_day")]

    def clean(self):
        if self.check_in_time and self.check_out_time and self.check_out_time < self.check_in_time:
            raise ValidationError("L'heure de sortie ne peut pas précéder l'heure d'entrée.")

# ---------------------------------------------------------------------------
# Contract
# ---------------------------------------------------------------------------

class Contract(models.Model):
    employee = models.ForeignKey(
        "hr.Employee", on_delete=models.CASCADE, null=True, blank=True, related_name="contracts"
    )
    contract_type = models.CharField(max_length=20, choices=ContractType.choices)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(
        max_length=3, choices=Currency.choices, default=Currency.HTG
    )
    status = models.CharField(
        max_length=20, choices=ContractStatus.choices, default=ContractStatus.DRAFT
    )
    contract_file = models.FileField(upload_to="hr/contracts/", null=True, blank=True)
    notice_period_days = models.PositiveIntegerField(default=30)
    termination_reason = models.TextField(blank=True)
    termination_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"Contrat {self.get_contract_type_display()} — {self.employee}"

    def clean(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError("La date de fin ne peut pas précéder la date de début.")

        if self.status == ContractStatus.ACTIVE:
            active_qs = Contract.objects.filter(
                employee=self.employee, status=ContractStatus.ACTIVE
            ).exclude(pk=self.pk)
            if active_qs.exists():
                raise ValidationError(
                    "Ce formateur a déjà un contrat actif. "
                    "Terminez ou expirez l'ancien contrat avant d'en activer un nouveau."
                )

    def terminate(self, reason: str, termination_date=None):
        self.status = ContractStatus.TERMINATED
        self.termination_reason = reason
        self.termination_date = termination_date or timezone.now().date()
        self.full_clean()
        self.save()


# ---------------------------------------------------------------------------
# Salary
# ---------------------------------------------------------------------------

class Salary(models.Model):
    employee = models.ForeignKey(
        "hr.Employee", on_delete=models.CASCADE, null=True, blank=True, related_name="salaries"
    )
    contract = models.ForeignKey(
        Contract, on_delete=models.SET_NULL, null=True, blank=True, related_name="salaries"
    )
    pay_period_start = models.DateField()
    pay_period_end = models.DateField()
    base_salary = models.DecimalField(max_digits=10, decimal_places=2)
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    net_salary = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    status = models.CharField(
        max_length=20, choices=SalaryStatus.choices, default=SalaryStatus.PENDING
    )
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    payslip_file = models.FileField(upload_to="hr/payslips/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("employee", "pay_period_start", "pay_period_end")
        ordering = ["-pay_period_start"]

    def __str__(self):
        return f"Paie {self.employee} — {self.pay_period_start:%Y-%m}"

    def clean(self):
        if self.pay_period_end < self.pay_period_start:
            raise ValidationError("La fin de période ne peut pas précéder le début.")

    def save(self, *args, **kwargs):
        self.net_salary = self.base_salary + self.bonuses - self.deductions
        super().save(*args, **kwargs)

    def mark_paid(self, payment_date=None, payment_reference: str = ""):
        self.status = SalaryStatus.PAID
        self.payment_date = payment_date or timezone.now().date()
        if payment_reference:
            self.payment_reference = payment_reference
        self.save()


# ---------------------------------------------------------------------------
# Leave
# ---------------------------------------------------------------------------

class Leave(models.Model):
    employee = models.ForeignKey(
        "hr.Employee", on_delete=models.CASCADE, null=True, blank=True, related_name="leaves"
    )
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.PROTECT, related_name="leaves"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    days_used = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=LeaveStatus.choices, default=LeaveStatus.PENDING
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_leaves",
    )
    reason = models.TextField(blank=True)
    attachment = models.FileField(upload_to="hr/leave_attachments/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"Congé {self.leave_type} — {self.employee} ({self.status})"

    @classmethod
    def remaining_balance(cls, employee, leave_type, year: int) -> Decimal:
        used = cls.objects.filter(
            employee=employee,
            leave_type=leave_type,
            status=LeaveStatus.APPROVED,
            start_date__year=year,
        ).aggregate(total=models.Sum("days_used"))["total"] or Decimal("0")
        return leave_type.days_per_year - used

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("La date de fin ne peut pas précéder la date de début.")

        overlap = (
            Leave.objects.filter(
                employee=self.employee,
                start_date__lte=self.end_date,
                end_date__gte=self.start_date,
            )
            .exclude(pk=self.pk)
            .exclude(status__in=[LeaveStatus.REJECTED, LeaveStatus.CANCELLED])
        )
        if overlap.exists():
            raise ValidationError("Ce formateur a déjà un congé sur une période qui chevauche celle-ci.")

        if self.status in (LeaveStatus.PENDING,):
            balance = self.remaining_balance(self.employee, self.leave_type, self.start_date.year)
            if self.days_used > balance:
                raise ValidationError(
                    f"Solde insuffisant : {balance} jour(s) restant(s) pour {self.leave_type}."
                )

    def approve(self, approver):
        self.status = LeaveStatus.APPROVED
        self.approver = approver
        self.full_clean()
        self.save()

    def reject(self, approver):
        self.status = LeaveStatus.REJECTED
        self.approver = approver
        self.save()


# ---------------------------------------------------------------------------
# PerformanceEvaluation
# ---------------------------------------------------------------------------

class PerformanceEvaluation(models.Model):
    employee = models.ForeignKey(
        "hr.Employee", on_delete=models.CASCADE, null=True, blank=True, related_name="evaluations"
    )
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="evaluations_given"
    )
    evaluation_date = models.DateField()
    evaluation_period_start = models.DateField(null=True, blank=True)
    evaluation_period_end = models.DateField(null=True, blank=True)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("1")), MaxValueValidator(Decimal("5"))],
    )
    criteria_scores = models.JSONField(default=dict, blank=True)
    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    evaluation_type = models.CharField(max_length=20, choices=EvaluationType.choices)
    employee_acknowledged = models.BooleanField(default=False)
    employee_comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-evaluation_date"]

    def __str__(self):
        return f"Évaluation {self.employee} — {self.evaluation_date}"

    def acknowledge(self, comments: str = ""):
        self.employee_acknowledged = True
        if comments:
            self.employee_comments = comments
        self.save()


# ---------------------------------------------------------------------------
# HRDocument
# ---------------------------------------------------------------------------

class HRDocument(models.Model):
    employee = models.ForeignKey(
        "hr.Employee", on_delete=models.CASCADE, null=True, blank=True, related_name="hr_documents"
    )
    document_type = models.CharField(max_length=20, choices=HRDocumentType.choices)
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to="hr/documents/")
    description = models.TextField(blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=HRDocumentStatus.choices, default=HRDocumentStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_document_type_display()} — {self.employee}"

    def refresh_status(self, warning_window_days: int = 30):
        """Appelé par le job Celery périodique (voir tasks.py)."""
        if not self.expiry_date:
            return
        today = timezone.now().date()
        if self.expiry_date < today:
            self.status = HRDocumentStatus.EXPIRED
        elif (self.expiry_date - today).days <= warning_window_days:
            self.status = HRDocumentStatus.EXPIRING_SOON
        else:
            self.status = HRDocumentStatus.VALID
        self.save(update_fields=["status"])


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------

class AuditLog(models.Model):
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="hr_audit_entries",
    )
    entity_type = models.CharField(max_length=20, choices=AuditEntityType.choices)
    entity_id = models.PositiveIntegerField()
    action = models.CharField(max_length=20, choices=AuditAction.choices)
    changes_json = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    action_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-action_at"]
        verbose_name = "Audit log RH"
        verbose_name_plural = "Audit logs RH"

    def __str__(self):
        return f"{self.action} {self.entity_type}#{self.entity_id} par {self.admin}"

    @classmethod
    def record(cls, *, user, action, entity_type, entity_id, old=None, new=None, request=None):
        ip = None
        if request is not None:
            xff = request.META.get("HTTP_X_FORWARDED_FOR")
            ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")
        return cls.objects.create(
            admin=user if getattr(user, "is_authenticated", False) else None,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            changes_json={"old": old, "new": new},
            ip_address=ip,
        )
