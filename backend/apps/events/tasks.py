from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.events.models import Event, EventReminderDispatch


@shared_task
def send_upcoming_event_reminders():
    """
    Tâche Celery beat (toutes les minutes) : dépose un rappel au moment
    configuré dans ``calendar_metadata.alarme.avance``. Chaque couple
    événement/utilisateur/instant est tracé pour éviter les doublons.
    """
    try:
        from apps.notifications.services import enqueue_notification
    except ImportError:
        return

    now = timezone.now()
    upcoming = Event.objects.filter(
        status__in=("published", "ongoing"), start_datetime__gt=now
    ).prefetch_related("participants")

    for event in upcoming:
        alarm = (event.calendar_metadata or {}).get("alarme") or {}
        try:
            advance_minutes = max(0, int(alarm.get("avance", 0)))
        except (TypeError, ValueError):
            continue

        scheduled_for = event.start_datetime - timedelta(minutes=advance_minutes)
        if scheduled_for > now:
            continue

        recipient_ids = set(
            event.participants.filter(status__in=("registered", "attended")).values_list(
                "user_id", flat=True
            )
        )
        if event.creator_id:
            recipient_ids.add(event.creator_id)

        for recipient_id in recipient_ids:
            _, created = EventReminderDispatch.objects.get_or_create(
                event=event, user_id=recipient_id, scheduled_for=scheduled_for
            )
            if not created:
                continue
            enqueue_notification(
                recipient_id=recipient_id,
                trigger_type="event_reminder",
                context={
                    "event_name": event.name,
                    "start_datetime": event.start_datetime.isoformat(),
                    "location": event.location,
                },
                priority="high",
            )
