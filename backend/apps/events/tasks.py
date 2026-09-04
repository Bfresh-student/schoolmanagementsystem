from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.events.models import Event, EventReminderDispatch


@shared_task
def progress_event_lifecycle():
    """Fait passer automatiquement un événement publié à en cours puis terminé."""
    now = timezone.now()
    started = Event.objects.filter(status="published", start_datetime__lte=now, end_datetime__gt=now)
    completed = Event.objects.filter(status__in=("published", "ongoing"), end_datetime__lte=now)

    def notify(events, trigger_type, priority):
        count = 0
        for event in events.select_related("creator"):
            event.status = "ongoing" if trigger_type == "event_started" else "completed"
            event.save(update_fields=["status", "updated_at"])
            count += 1
            if event.creator_id:
                try:
                    from apps.notifications.services import enqueue_notification
                    enqueue_notification(
                        recipient_id=event.creator_id,
                        trigger_type=trigger_type,
                        context={"event_name": event.name, "start_datetime": event.start_datetime.isoformat()},
                        priority=priority,
                    )
                except Exception:
                    pass
        return count

    return {"started": notify(started, "event_started", "normal"), "completed": notify(completed, "event_completed", "normal")}


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
        status__in=("published", "ongoing"),
        # Une petite fenêtre de grâce évite de rater une alarme réglée à
        # l'heure exacte si le beat s'exécute quelques secondes après elle.
        start_datetime__gte=now - timedelta(minutes=5),
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
