from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.students.models import Specialization, Student

User = get_user_model()


class StudentModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="jean.dupont@example.com", password="testpass123"
        )
        self.spec = Specialization.objects.create(name="Informatique")

    def test_registration_number_auto_generated(self):
        student = Student.objects.create(user=self.user, specialization=self.spec)
        self.assertTrue(student.registration_number.startswith("PROF-"))

    def test_registration_number_increments(self):
        s1 = Student.objects.create(user=self.user, specialization=self.spec)
        user2 = User.objects.create_user(email="marie@example.com", password="testpass123")
        s2 = Student.objects.create(user=user2, specialization=self.spec)
        n1 = int(s1.registration_number.split("-")[-1])
        n2 = int(s2.registration_number.split("-")[-1])
        self.assertEqual(n2, n1 + 1)

    def test_anonymize_clears_sensitive_fields(self):
        student = Student.objects.create(
            user=self.user,
            address="12 rue Example",
            emergency_contacts=[{"name": "Mère", "phone": "+50912345678"}],
        )
        student.anonymize()
        student.refresh_from_db()
        self.user.refresh_from_db()
        self.assertEqual(student.address, "")
        self.assertEqual(student.emergency_contacts, [])
        self.assertFalse(student.is_active)
        self.assertEqual(student.status, Student.Status.WITHDRAWN)
        self.assertTrue(self.user.email.startswith("deleted_"))


class StudentAPITests(TestCase):
    def setUp(self):
        self.admin_client = APIClient()
        self.teacher_client = APIClient()
        self.student_client = APIClient()

        self.admin_user = User.objects.create_superuser(
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            password="testpass123",
        )
        self.teacher_user = User.objects.create_user(
            email="teacher@example.com",
            first_name="Jane",
            last_name="Teacher",
            password="testpass123",
            role="TEACHER",
            status="ACTIVE",
        )
        self.student_user = User.objects.create_user(
            email="student@example.com",
            first_name="Jean",
            last_name="Dupont",
            password="testpass123",
            role="STUDENT",
            status="ACTIVE",
        )
        self.other_student_user = User.objects.create_user(
            email="other.student@example.com",
            first_name="Marie",
            last_name="Durand",
            password="testpass123",
            role="STUDENT",
            status="ACTIVE",
        )
        self.specialization = Specialization.objects.create(name="Informatique")
        self.student = Student.objects.create(
            user=self.student_user,
            specialization=self.specialization,
        )
        self.other_student = Student.objects.create(
            user=self.other_student_user,
            specialization=self.specialization,
        )

    def _auth(self, client, user):
        client.force_authenticate(user=user)
        return client

    def test_unauthenticated_access_denied(self):
        response = APIClient().get("/api/v1/students/students/")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_teacher_can_list_students(self):
        response = self._auth(self.teacher_client, self.teacher_user).get("/api/v1/students/students/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_student_only_sees_own_profile(self):
        response = self._auth(self.student_client, self.student_user).get("/api/v1/students/students/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.student.id)

    def test_student_can_access_me_endpoint(self):
        response = self._auth(self.student_client, self.student_user).get("/api/v1/students/students/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.student.id)

    def test_student_cannot_access_other_profile(self):
        response = self._auth(self.student_client, self.student_user).get(
            f"/api/v1/students/students/{self.other_student.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_teacher_cannot_anonymize_student(self):
        response = self._auth(self.teacher_client, self.teacher_user).post(
            f"/api/v1/students/students/{self.student.id}/anonymize/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_anonymize_student(self):
        response = self._auth(self.admin_client, self.admin_user).post(
            f"/api/v1/students/students/{self.student.id}/anonymize/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.status, Student.Status.WITHDRAWN)
        self.assertFalse(self.student.is_active)

    def test_teacher_cannot_create_specialization(self):
        response = self._auth(self.teacher_client, self.teacher_user).post(
            "/api/v1/students/specializations/",
            {"name": "Commerce", "description": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_specialization(self):
        response = self._auth(self.admin_client, self.admin_user).post(
            "/api/v1/students/specializations/",
            {"name": "Commerce", "description": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Specialization.objects.filter(name="Commerce").exists())

    # D'autres tests (avec rôles/permissions mockés) sont à ajouter une fois
    # l'app "users" (rôles + permissions) branchée dans les fixtures de test.