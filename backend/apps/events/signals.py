from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.events.models import Event


@receiver(pre_save, sender=Event)
def cache_previous_status(sender, instance: Event, **kwargs):
    if instance.pk:
        try:
            instance._previous_status = Event.objects.get(pk=instance.pk).status
        except Event.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


@receiver(post_save, sender=Event)
def on_event_saved(sender, instance: Event, created, **kwargs):
    """Au passage à 'published', notifie qu'un nouvel événement est ouvert."""
    try:
        from apps.notifications.services import enqueue_notification
    except ImportError:
        return

    previous_status = getattr(instance, "_previous_status", None)
    if previous_status != "published" and instance.status == "published":
        enqueue_notification(
            recipient_id=instance.creator_id,
            trigger_type="event_published_confirmation",
            context={"event_name": instance.name},
        )
