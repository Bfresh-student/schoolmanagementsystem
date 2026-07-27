from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.events.models import Event, EventParticipant

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