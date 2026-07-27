from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.events.models import Event


@shared_task
def send_upcoming_event_reminders():
    """
    Tâche Celery beat (ex: toutes les heures) : envoie un rappel aux
    participants confirmés des événements qui démarrent dans les
    24h et n'ont pas encore reçu de rappel.
    """
    try:
        from apps.notifications.services import enqueue_notification
    except ImportError:
        return

    now = timezone.now()
    window_end = now + timedelta(hours=24)
    upcoming = Event.objects.filter(
        status="published", start_datetime__gte=now, start_datetime__lte=window_end
    )

    for event in upcoming:
        participants = event.participants.filter(status="registered")
        for participant in participants:
            enqueue_notification(
                recipient_id=participant.user_id,
                trigger_type="event_reminder_24h",
                context={
                    "event_name": event.name,
                    "start_datetime": event.start_datetime.isoformat(),
                },
            )
