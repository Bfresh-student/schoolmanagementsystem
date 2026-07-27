from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings

from apps.notifications.models import (
    Notification,
    NotificationChannel,
    NotificationQueueEntry,
    NotificationTemplate,
    NotificationTrigger,
)
from .services import enqueue_notification

User = get_user_model()


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class EnqueueNotificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="etu1@ecole.ht", password="testpass123", role="STUDENT"
        )
        self.email_channel, _ = NotificationChannel.objects.get_or_create(name="email")
        self.in_app_channel, _ = NotificationChannel.objects.get_or_create(name="in_app")
        self.trigger = NotificationTrigger.objects.create(
            trigger_name="grade_added",
            template_key="grade_added",
            default_priority="normal",
        )
        NotificationTemplate.objects.create(
            template_key="grade_added",
            channel=self.in_app_channel,
            subject_line="Nouvelle note",
            content_template="Votre note en {course_name} : {grade}/20",
        )
        NotificationTemplate.objects.create(
            template_key="grade_added",
            channel=self.email_channel,
            subject_line="Nouvelle note disponible",
            content_template="Bonjour, votre note en {course_name} est {grade}/20.",
        )

    def test_creates_notification_and_queue_entries(self):
        notifications = enqueue_notification(
            recipient_id=self.user.id,
            trigger_type="grade_added",
            context={"course_name": "Développement Web", "grade": 16},
        )
        self.assertEqual(len(notifications), 1)
        notification = Notification.objects.get(recipient=self.user)
        self.assertIn("Développement Web", notification.content)

        entries = NotificationQueueEntry.objects.filter(notification=notification)
        self.assertEqual(entries.count(), 2)  # email + in_app

    def test_no_recipient_returns_empty(self):
        result = enqueue_notification(trigger_type="grade_added", context={})
        self.assertEqual(result, [])