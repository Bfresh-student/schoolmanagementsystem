from datetime import datetime, timezone as dt_timezone
from decimal import Decimal

from django.test import TestCase

from apps.courses.models import Course
from apps.students.models import Student
from apps.teachers.models import Teacher
from apps.users.models import User

from apps.grades import services
from apps.grades.models import Grade, GradeConflict, GradeSyncEntry, SyncEntryStatus


def _dt(hour, minute):
    return datetime(2024, 6, 10, hour, minute, tzinfo=dt_timezone.utc)


class GradeConflictScenarioTests(TestCase):
    """Reproduit le Cas 2 du document : prof offline (16) vs admin online (14)."""

    def setUp(self):
        from apps.students.models import Specialization
        specialization = Specialization.objects.create(name="Informatique")

        student_user = User.objects.create_user(
            email="x@test.com", password="password123", first_name="Student", last_name="User", role="STUDENT"
        )
        self.student = Student.objects.create(user=student_user, registration_number="PROF-2024-010")

        teacher_user = User.objects.create_user(
            email="prof@test.com", password="password123", first_name="Prof", last_name="User", role="TEACHER"
        )
        self.teacher = teacher_user.teacher_profile

        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="password123", first_name="Admin", last_name="User", role="ADMIN"
        )
        self.course = Course.objects.create(
            name="Cours Y", code="Y100", teacher=self.teacher,
            specialization=specialization, duration_weeks=10, fees_amount=5000,
        )

    def test_no_conflict_when_grade_is_new(self):
        entry, result = services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("16"), source=GradeSyncEntry.Source.LOCAL,
            submitted_by=self.teacher.user, local_timestamp=_dt(14, 30),
        )
        self.assertEqual(result["outcome"], "applied")
        self.assertEqual(Grade.objects.get(student=self.student, course=self.course).value, Decimal("16"))

    def test_conflict_detected_when_values_differ(self):
        # 14:30 - le prof saisit 16 EN LOCAL (mais on ne "process" pas encore
        # côté serveur : c'est simplement stocké localement, donc le serveur
        # ne le voit pas tant qu'il n'est pas rejoué).
        # 15:00 - admin en ligne saisit 14 -> traité IMMÉDIATEMENT côté serveur.
        _, admin_result = services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("14"), source=GradeSyncEntry.Source.REMOTE,
            submitted_by=self.admin_user, local_timestamp=_dt(15, 0),
        )
        self.assertEqual(admin_result["outcome"], "applied")

        # JOUR 2 - le prof se reconnecte : son entrée (créée à 14:30) est
        # rejouée contre le serveur.
        prof_entry, prof_result = services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("16"), source=GradeSyncEntry.Source.LOCAL,
            submitted_by=self.teacher.user, local_timestamp=_dt(14, 30),
        )

        self.assertEqual(prof_result["outcome"], "conflict")
        conflict = GradeConflict.objects.get(id=prof_result["conflict_id"])
        self.assertEqual(conflict.local_version["value"], "16")
        self.assertEqual(conflict.remote_version["value"], "14.00")

        # La note en base reste celle de l'admin en attendant l'arbitrage,
        # mais est marquée non synchronisée pour signaler l'incertitude.
        grade = Grade.objects.get(student=self.student, course=self.course)
        self.assertEqual(grade.value, Decimal("14"))
        self.assertFalse(grade.synced)

    def test_admin_resolves_conflict_keeping_local_value(self):
        services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("14"), source=GradeSyncEntry.Source.REMOTE,
            submitted_by=self.admin_user, local_timestamp=_dt(15, 0),
        )
        _, prof_result = services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("16"), source=GradeSyncEntry.Source.LOCAL,
            submitted_by=self.teacher.user, local_timestamp=_dt(14, 30),
        )
        conflict = GradeConflict.objects.get(id=prof_result["conflict_id"])

        grade = conflict.resolve(choice=GradeConflict.Resolution.LOCAL, actor=self.admin_user)

        self.assertEqual(Decimal(grade.value), Decimal("16"))
        self.assertTrue(grade.synced)
        self.assertEqual(conflict.sync_entry.status, SyncEntryStatus.APPLIED)
        self.assertTrue(conflict.is_resolved)

    def test_cannot_resolve_conflict_twice(self):
        services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("14"), source=GradeSyncEntry.Source.REMOTE,
            submitted_by=self.admin_user, local_timestamp=_dt(15, 0),
        )
        _, prof_result = services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("16"), source=GradeSyncEntry.Source.LOCAL,
            submitted_by=self.teacher.user, local_timestamp=_dt(14, 30),
        )
        conflict = GradeConflict.objects.get(id=prof_result["conflict_id"])
        conflict.resolve(choice=GradeConflict.Resolution.REMOTE, actor=self.admin_user)

        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            conflict.resolve(choice=GradeConflict.Resolution.LOCAL, actor=self.admin_user)

    def test_idempotent_replay_does_not_duplicate_entry(self):
        entry, _ = services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("16"), source=GradeSyncEntry.Source.LOCAL,
            submitted_by=self.teacher.user, local_timestamp=_dt(14, 30),
        )
        # Reconnexion instable : le même paquet est rejoué avec le même local_uuid.
        entry2, result2 = services.submit_grade(
            student=self.student, course=self.course, teacher=self.teacher,
            value=Decimal("16"), source=GradeSyncEntry.Source.LOCAL,
            submitted_by=self.teacher.user, local_timestamp=_dt(14, 30),
            local_uuid=entry.local_uuid,
        )
        self.assertEqual(entry.id, entry2.id)
        self.assertEqual(result2["outcome"], "discarded")
        self.assertEqual(GradeSyncEntry.objects.filter(local_uuid=entry.local_uuid).count(), 1)
