from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.courses.models import Course
from apps.students.models import Specialization, Student
from apps.users.models import User

from apps.enrollments.models import Inscription, InscriptionStatus


class InscriptionStateMachineTests(TestCase):
    def setUp(self):
        user = User.objects.create(email="e1@test.com", role="STUDENT")
        self.student = Student.objects.create(user=user, registration_number="PROF-2024-001")
        specialization = Specialization.objects.create(name="Informatique")
        self.course = Course.objects.create(
            name="Développement Web",
            code="DEV101",
            specialization=specialization,
            duration_weeks=12,
            fees_amount=500.00,
        )
        self.inscription = Inscription.objects.create(student=self.student, course=self.course)

    def test_default_status_is_pending(self):
        self.assertEqual(self.inscription.status, InscriptionStatus.PENDING)

    def test_valid_transition_pending_to_approved(self):
        self.inscription.transition_to(InscriptionStatus.APPROVED)
        self.assertEqual(self.inscription.status, InscriptionStatus.APPROVED)
        self.assertIsNotNone(self.inscription.approved_at)

    def test_invalid_transition_raises(self):
        with self.assertRaises(ValidationError):
            self.inscription.transition_to(InscriptionStatus.VALIDATED)  # pending -> validated interdit

    def test_terminal_states_have_no_outgoing_transitions(self):
        self.inscription.transition_to(InscriptionStatus.REJECTED, reason="incomplet")
        with self.assertRaises(ValidationError):
            self.inscription.transition_to(InscriptionStatus.APPROVED)

    def test_reenrollment_allowed_after_rejection(self):
        """Un rejet ne bloque pas une nouvelle inscription au même cours."""
        self.inscription.transition_to(InscriptionStatus.REJECTED, reason="incomplet")
        second = Inscription.objects.create(student=self.student, course=self.course)
        self.assertEqual(second.status, InscriptionStatus.PENDING)

    def test_duplicate_active_inscription_blocked(self):
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Inscription.objects.create(student=self.student, course=self.course)


class OfflineSyncIdempotenceTests(TestCase):
    def setUp(self):
        user = User.objects.create(email="e2@test.com", role="STUDENT")
        self.student = Student.objects.create(user=user, registration_number="PROF-2024-002")
        specialization = Specialization.objects.create(name="Commerce")
        self.course = Course.objects.create(
            name="Commerce International",
            code="COM101",
            specialization=specialization,
            duration_weeks=10,
            fees_amount=450.00,
        )

    def test_replay_with_same_local_uuid_does_not_duplicate(self):
        from .serializers import InscriptionCreateSerializer

        payload = {
            "student": self.student.id,
            "course": self.course.id,
            "created_offline": True,
        }
        s1 = InscriptionCreateSerializer(data=payload)
        s1.is_valid(raise_exception=True)
        first = s1.save()

        # Simule un replay de la queue avec le MÊME local_uuid (reconnexion instable)
        replay_payload = {**payload, "local_uuid": str(first.local_uuid)}
        s2 = InscriptionCreateSerializer(data=replay_payload)
        s2.is_valid(raise_exception=True)
        second = s2.save()

        self.assertEqual(first.id, second.id)
        self.assertEqual(Inscription.objects.filter(student=self.student, course=self.course).count(), 1)