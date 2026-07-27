import uuid
from datetime import date, datetime, timezone as dt_timezone

from django.test import TestCase

from apps.courses.models import Course
from apps.attendances import services
from apps.attendances.models import Attendance, AttendanceConflict, AttendanceSyncEntry, SyncEntryStatus
from apps.students.models import Specialization, Student
from apps.teachers.models import Teacher
from apps.users.models import User


def _dt(hour, minute):
    return datetime(2024, 6, 10, hour, minute, tzinfo=dt_timezone.utc)


class AttendanceBatchTests(TestCase):
    """Reproduit le Cas 3 du document : appel de N étudiants en une fois, offline puis sync."""

    def setUp(self):
        self.specialization = Specialization.objects.create(name="Informatique")

        teacher_user = User.objects.create_user(
            email="prof2@test.com",
            password="password123",
            first_name="Prof",
            last_name="Deux",
            role="TEACHER",
        )
        self.teacher = teacher_user.teacher_profile
        self.course = Course.objects.create(
            name="Mathématiques",
            code="MTH101",
            teacher=self.teacher,
            specialization=self.specialization,
            duration_weeks=12,
            fees_amount=5000,
        )

        self.students = []
        for i in range(35):
            u = User.objects.create_user(
                email=f"eleve{i}@test.com",
                password="password123",
                first_name=f"Eleve{i}",
                last_name="Test",
                role="STUDENT",
            )
            self.students.append(Student.objects.create(user=u, registration_number=f"PROF-2024-{100+i}"))

    def test_batch_of_35_no_conflict(self):
        """30 présents, 5 absents — comme dans le document — traités en un seul appel."""
        items = []
        for i, student in enumerate(self.students):
            present = i >= 5  # les 5 premiers sont absents
            items.append({
                "student": student.id,
                "present": present,
                "reason_if_absent": None if present else "Non justifiée",
                "local_timestamp": _dt(8, 0),
            })

        summary = services.submit_attendance_batch(
            items=items, course=self.course, teacher=self.teacher,
            attendance_date=date(2024, 6, 10),
            source=AttendanceSyncEntry.Source.LOCAL,
            submitted_by=self.teacher.user,
        )

        self.assertEqual(summary["applied"], 35)
        self.assertEqual(summary["conflicts"], 0)
        self.assertEqual(summary["absences"], 5)
        self.assertEqual(Attendance.objects.filter(course=self.course, attendance_date=date(2024, 6, 10)).count(), 35)
        self.assertTrue(all(a.synced for a in Attendance.objects.filter(course=self.course)))

    def test_replay_batch_is_idempotent(self):
        local_uuid = uuid.uuid4()
        items = [{
            "student": self.students[0].id,
            "present": True,
            "local_timestamp": _dt(8, 0),
            "local_uuid": local_uuid,
        }]
        summary1 = services.submit_attendance_batch(
            items=items, course=self.course, teacher=self.teacher,
            attendance_date=date(2024, 6, 10),
            source=AttendanceSyncEntry.Source.LOCAL, submitted_by=self.teacher.user,
        )
        self.assertEqual(summary1["applied"], 1)

        # Reconnexion instable : le même paquet est renvoyé intégralement.
        summary2 = services.submit_attendance_batch(
            items=items, course=self.course, teacher=self.teacher,
            attendance_date=date(2024, 6, 10),
            source=AttendanceSyncEntry.Source.LOCAL, submitted_by=self.teacher.user,
        )
        self.assertEqual(summary2["skipped_duplicates"], 1)
        self.assertEqual(
            Attendance.objects.filter(student=self.students[0], course=self.course).count(), 1
        )


class AttendanceConflictTests(TestCase):
    """Un remplaçant refait l'appel et marque un étudiant différemment."""

    def setUp(self):
        self.specialization = Specialization.objects.create(name="Sciences")

        titulaire_user = User.objects.create_user(
            email="titulaire@test.com",
            password="password123",
            first_name="Titulaire",
            last_name="Test",
            role="TEACHER",
        )
        self.titulaire = titulaire_user.teacher_profile
        remplacant_user = User.objects.create_user(
            email="remplacant@test.com",
            password="password123",
            first_name="Remplacant",
            last_name="Test",
            role="TEACHER",
        )
        self.remplacant = remplacant_user.teacher_profile

        self.course = Course.objects.create(
            name="Physique",
            code="PHY101",
            teacher=self.titulaire,
            specialization=self.specialization,
            duration_weeks=10,
            fees_amount=4500,
        )
        s_user = User.objects.create_user(
            email="eleveX@test.com",
            password="password123",
            first_name="Eleve",
            last_name="X",
            role="STUDENT",
        )
        self.student = Student.objects.create(user=s_user, registration_number="PROF-2024-999")

    def test_conflicting_rollcalls_create_conflict(self):
        # Le titulaire fait l'appel à 8h00 et marque l'étudiant présent.
        services.submit_attendance_batch(
            items=[{"student": self.student.id, "present": True, "local_timestamp": _dt(8, 0)}],
            course=self.course, teacher=self.titulaire, attendance_date=date(2024, 6, 10),
            source=AttendanceSyncEntry.Source.REMOTE, submitted_by=self.titulaire.user,
        )
        # Le remplaçant refait l'appel à 8h30 et le marque absent.
        summary = services.submit_attendance_batch(
            items=[{"student": self.student.id, "present": False,
                     "reason_if_absent": "Vu absent en classe", "local_timestamp": _dt(8, 30)}],
            course=self.course, teacher=self.remplacant, attendance_date=date(2024, 6, 10),
            source=AttendanceSyncEntry.Source.REMOTE, submitted_by=self.remplacant.user,
        )

        self.assertEqual(summary["conflicts"], 1)
        conflict = AttendanceConflict.objects.get(id=summary["conflict_ids"][0])
        self.assertTrue(conflict.remote_version["present"])
        self.assertFalse(conflict.local_version["present"])

        attendance = Attendance.objects.get(student=self.student, course=self.course)
        self.assertFalse(attendance.synced)

    def test_admin_resolves_attendance_conflict(self):
        services.submit_attendance_batch(
            items=[{"student": self.student.id, "present": True, "local_timestamp": _dt(8, 0)}],
            course=self.course, teacher=self.titulaire, attendance_date=date(2024, 6, 10),
            source=AttendanceSyncEntry.Source.REMOTE, submitted_by=self.titulaire.user,
        )
        summary = services.submit_attendance_batch(
            items=[{"student": self.student.id, "present": False, "local_timestamp": _dt(8, 30)}],
            course=self.course, teacher=self.remplacant, attendance_date=date(2024, 6, 10),
            source=AttendanceSyncEntry.Source.REMOTE, submitted_by=self.remplacant.user,
        )
        conflict = AttendanceConflict.objects.get(id=summary["conflict_ids"][0])

        admin_user = User.objects.create_user(
            email="admin2@test.com",
            password="password123",
            first_name="Admin",
            last_name="Test",
            role="ADMIN",
        )

        attendance = conflict.resolve(choice=AttendanceConflict.Resolution.LOCAL, actor=admin_user)
        self.assertFalse(attendance.present)
        self.assertTrue(attendance.synced)
        self.assertEqual(conflict.sync_entry.status, SyncEntryStatus.APPLIED)
