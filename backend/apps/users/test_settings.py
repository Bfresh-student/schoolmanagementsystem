from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import SystemSetting
from apps.notifications.models import NotificationChannel
from apps.students.models import Student


class SystemSettingsAPITests(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            email="admin-settings@ecole.ht", password="testpass123", role="ADMIN"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_administrator_can_save_and_read_institution_settings(self):
        payload = {"settings": {"general": {"cejec-name": "CEJEC", "phone": "+509 2222"}}}
        response = self.client.patch("/api/v1/auth/users/settings/", payload, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(SystemSetting.objects.get(key="institution").value, payload["settings"])
        response = self.client.get("/api/v1/auth/users/settings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["settings"], payload["settings"])

    def test_global_search_returns_database_results(self):
        student_user = get_user_model().objects.create_user(
            email="alice.search@ecole.ht", password="testpass123", first_name="Alice",
            last_name="Recherche", role="STUDENT"
        )
        Student.objects.create(user=student_user)
        response = self.client.get("/api/v1/auth/users/global-search/?q=Alice")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(any(item["title"] == "Alice Recherche" for item in response.data["results"]))

    def test_notification_settings_enable_real_delivery_channels(self):
        payload = {"settings": {"notifications": {"notif-email": True, "notif-sms": False, "notif-system": True}}}
        response = self.client.patch("/api/v1/auth/users/settings/", payload, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(NotificationChannel.objects.get(name="email").is_active)
        self.assertFalse(NotificationChannel.objects.get(name="sms").is_active)
        self.assertTrue(NotificationChannel.objects.get(name="in_app").is_active)
