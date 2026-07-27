"""
App: Gestion Présence (Attendance)
====================================
Contrairement à Grades (une saisie isolée), une présence se saisit TOUJOURS
en lot : un appel = 1 cours + 1 date + N étudiants (Cas 3 du document,
"35 étudiants = 30 x ATTENDANCES INSERT"). L'architecture reprend donc le
pattern Queue + Conflict Detection de Grades, mais toutes les opérations
d'écriture sont pensées en BULK (bulk_create / bulk_update / une seule
requête de lecture) plutôt qu'enregistrement par enregistrement, pour rester
performant sur un appel de classe complet.
Un conflit reste possible mais rare : il survient si DEUX appels différents
sont faits pour le même (student, course, attendance_date) avec un résultat
différent (ex : un remplaçant refait l'appel et marque quelqu'un absent
alors que le titulaire l'avait marqué présent).
"""
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Attendance(models.Model):
    """Source de vérité : LE statut de présence d'un étudiant pour un cours à une date."""

    id = models.BigAutoField(primary_key=True)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="attendances")
    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE, related_name="attendances")
    teacher = models.ForeignKey("teachers.Teacher", on_delete=models.SET_NULL, null=True, related_name="+")

    attendance_date = models.DateField(default=timezone.now)
    present = models.BooleanField()
    reason_if_absent = models.TextField(blank=True, null=True)

    synced = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "attendances"
        app_label = "attendances"
        constraints = [
            models.UniqueConstraint(
                fields=["student", "course", "attendance_date"],
                name="uniq_attendance_per_student_course_date",
            )
        ]
        indexes = [
            models.Index(fields=["course", "attendance_date"]),
            models.Index(fields=["synced"]),
        ]

    def __str__(self):
        etat = "présent" if self.present else "absent"
        return f"{self.student} / {self.course} / {self.attendance_date} : {etat}"


class SyncEntryStatus(models.TextChoices):
    PENDING = "pending", "En attente de traitement"
    APPLIED = "applied", "Appliquée sans conflit"
    CONFLICT = "conflict", "En conflit"
    DISCARDED = "discarded", "Écartée (doublon idempotent)"


class AttendanceSyncEntry(models.Model):
    """Une ligne d'appel individuelle, avant fusion dans `Attendance`."""

    class Source(models.TextChoices):
        LOCAL = "local", "Saisie hors-ligne"
        REMOTE = "remote", "Saisie en ligne"

    id = models.BigAutoField(primary_key=True)
    local_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    student = models.ForeignKey("students.Student", on_delete=models.CASCADE)
    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE)
    teacher = models.ForeignKey("teachers.Teacher", on_delete=models.SET_NULL, null=True)

    attendance_date = models.DateField()
    present = models.BooleanField()
    reason_if_absent = models.TextField(blank=True, null=True)

    source = models.CharField(max_length=10, choices=Source.choices)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    local_timestamp = models.DateTimeField()

    status = models.CharField(max_length=12, choices=SyncEntryStatus.choices, default=SyncEntryStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attendance_sync_entries"
        app_label = "attendances"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["course", "attendance_date"]),
        ]

    def __str__(self):
        return f"[{self.source}] {self.student} / {self.course} / {self.attendance_date} ({self.status})"


class AttendanceConflict(models.Model):
    class Resolution(models.TextChoices):
        LOCAL = "local", "Garder la version locale"
        REMOTE = "remote", "Garder la version distante"
        MANUAL = "manual_merge", "Décision manuelle de l'admin"

    id = models.BigAutoField(primary_key=True)
    sync_entry = models.OneToOneField(AttendanceSyncEntry, on_delete=models.CASCADE, related_name="conflict")
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name="conflicts")

    local_version = models.JSONField()
    remote_version = models.JSONField()

    resolution_choice = models.CharField(max_length=15, choices=Resolution.choices, null=True, blank=True)
    resolved_present = models.BooleanField(null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attendance_conflicts"
        app_label = "attendances"

    @property
    def is_resolved(self):
        return self.resolution_choice is not None

    def resolve(self, choice: str, actor, manual_present=None):
        if self.is_resolved:
            raise ValidationError("Ce conflit a déjà été résolu.")

        if choice == self.Resolution.LOCAL:
            final_present = self.local_version["present"]
            final_reason = self.local_version.get("reason_if_absent")
        elif choice == self.Resolution.REMOTE:
            final_present = self.remote_version["present"]
            final_reason = self.remote_version.get("reason_if_absent")
        elif choice == self.Resolution.MANUAL:
            if manual_present is None:
                raise ValidationError("manual_present est requis pour ce choix.")
            final_present = manual_present
            final_reason = None
        else:
            raise ValidationError("Choix de résolution invalide.")

        self.resolution_choice = choice
        self.resolved_present = final_present
        self.resolved_by = actor
        self.resolved_at = timezone.now()
        self.save(update_fields=["resolution_choice", "resolved_present", "resolved_by", "resolved_at"])

        self.attendance.present = final_present
        self.attendance.reason_if_absent = final_reason
        self.attendance.synced = True
        self.attendance.save(update_fields=["present", "reason_if_absent", "synced", "updated_at"])

        self.sync_entry.status = SyncEntryStatus.APPLIED
        self.sync_entry.save(update_fields=["status"])

        from .signals import attendance_conflict_resolved
        attendance_conflict_resolved.send(sender=self.__class__, conflict=self, actor=actor)

        return self.attendance
