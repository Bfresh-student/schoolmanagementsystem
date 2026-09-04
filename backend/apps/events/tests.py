from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.events.models import Event, EventParticipant, EventReminderDispatch
from apps.events.tasks import progress_event_lifecycle, send_upcoming_event_reminders

User = get_user_model()


class EventModelTests(TestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            email="admin1@ecole.ht", password="testpass123", role="ADMIN"
        )
        self.start = timezone.now() + timedelta(days=1)
        self.event = Event.objects.create(
            name="Conférence IA",
            event_type="conference",
            start_datetime=self.start,
            end_datetime=self.start + timedelta(hours=2),
            capacity_max=1,
            status="published",
            creator=self.creator,
        )

    def test_capacity_and_waitlist_logic(self):
        user1 = User.objects.create_user(
            email="etu1@ecole.ht", password="testpass123", role="STUDENT"
        )
        user2 = User.objects.create_user(
            email="etu2@ecole.ht", password="testpass123", role="STUDENT"
        )

        p1 = EventParticipant.objects.create(event=self.event, user=user1, status="registered")
        self.assertTrue(self.event.is_full)

        p2 = EventParticipant.objects.create(event=self.event, user=user2, status="waitlisted")
        self.assertEqual(self.event.seats_available, 0)

        p1.status = "cancelled"
        p1.save()
        self.assertFalse(self.event.is_full)

    def test_unique_participant_per_event(self):
        user = User.objects.create_user(
            email="etu3@ecole.ht", password="testpass123", role="STUDENT"
        )
        EventParticipant.objects.create(event=self.event, user=user, status="registered")
        with self.assertRaises(Exception):
            EventParticipant.objects.create(event=self.event, user=user, status="registered")

    @patch("apps.notifications.services.enqueue_notification")
    def test_configured_reminder_is_dispatched_once_per_recipient(self, enqueue):
        participant_user = User.objects.create_user(
            email="reminder@ecole.ht", password="testpass123", role="STUDENT"
        )
        EventParticipant.objects.create(
            event=self.event, user=participant_user, status="registered"
        )
        self.event.start_datetime = timezone.now() + timedelta(minutes=10)
        self.event.end_datetime = self.event.start_datetime + timedelta(hours=2)
        self.event.calendar_metadata = {"alarme": {"avance": 15}}
        self.event.save()

        send_upcoming_event_reminders()
        send_upcoming_event_reminders()

        self.assertEqual(EventReminderDispatch.objects.filter(event=self.event).count(), 2)
        self.assertEqual(enqueue.call_count, 2)
        self.assertTrue(
            all(call.kwargs["trigger_type"] == "event_reminder" for call in enqueue.call_args_list)
        )

    @patch("apps.notifications.services.enqueue_notification")
    def test_event_lifecycle_is_progressed_and_notified(self, enqueue):
        self.event.start_datetime = timezone.now() - timedelta(minutes=5)
        self.event.end_datetime = timezone.now() + timedelta(minutes=5)
        self.event.save()
        progress_event_lifecycle()
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, "ongoing")
        self.assertEqual(enqueue.call_args.kwargs["trigger_type"], "event_started")

        self.event.end_datetime = timezone.now() - timedelta(minutes=1)
        self.event.save()
        progress_event_lifecycle()
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, "completed")
