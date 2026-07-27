from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.notifications.models import NotificationQueueEntry


@receiver(post_save, sender=NotificationQueueEntry)
def dispatch_on_create(sender, instance: NotificationQueueEntry, created, **kwargs):
    """
    Filet de sécurité : si une entrée de queue est créée autrement
    que via services.enqueue_notification() (ex: import de données,
    admin Django, resynchronisation manuelle), on s'assure qu'elle
    soit bien prise en charge par Celery si elle nécessite le réseau.
    """
    if not created or instance.channel.name == "in_app":
        return
    if instance.status != "pending":
        return

    try:
        from .tasks import send_queued_notification

        send_queued_notification.delay(str(instance.id))
    except Exception:
        pass  # Celery indisponible (ex: tests) -> reste en pending, repris plus tard
