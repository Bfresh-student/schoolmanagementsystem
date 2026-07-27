import logging

from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone

from apps.notifications.models import Notification, NotificationQueueEntry

logger = logging.getLogger(__name__)

MAX_RETRIES = 5


@shared_task(bind=True, max_retries=MAX_RETRIES)
def send_queued_notification(self, queue_entry_id):
    """
    Envoie une entrée de NotificationQueueEntry sur son canal.
    En cas d'échec réseau (pas de connexion, ex. école en local),
    l'entrée reste 'pending' et sera reprise au prochain passage du
    Sync Manager / du beat Celery, conformément au principe
    "queue + replay" du document.
    """
    try:
        entry = NotificationQueueEntry.objects.select_related(
            "notification", "channel"
        ).get(pk=queue_entry_id)
    except NotificationQueueEntry.DoesNotExist:
        logger.error("send_queued_notification: entrée %s introuvable", queue_entry_id)
        return

    if entry.status == "sent":
        return  # idempotence : déjà envoyée

    try:
        if entry.channel.name == "email":
            _send_email(entry)
        elif entry.channel.name == "sms":
            _send_sms(entry)
        elif entry.channel.name == "push":
            _send_push(entry)
        else:
            entry.status = "sent"
            entry.synced = True
            entry.save(update_fields=["status", "synced"])
            return

        entry.status = "sent"
        entry.synced = True
        entry.error_message = ""
        entry.save(update_fields=["status", "synced", "error_message"])

    except Exception as exc:  # noqa: BLE001
        entry.retry_count += 1
        entry.error_message = str(exc)[:500]
        entry.status = "failed" if entry.retry_count >= MAX_RETRIES else "pending"
        entry.save(update_fields=["retry_count", "error_message", "status"])
        logger.warning(
            "Échec envoi notification %s via %s (tentative %s): %s",
            entry.notification_id,
            entry.channel.name,
            entry.retry_count,
            exc,
        )
        if entry.retry_count < MAX_RETRIES:
            raise self.retry(exc=exc, countdown=min(60 * entry.retry_count, 900))


def _send_email(entry: NotificationQueueEntry):
    notification: Notification = entry.notification
    send_mail(
        subject=notification.title,
        message=notification.content,
        from_email=None,  # utilise DEFAULT_FROM_EMAIL
        recipient_list=[entry.recipient_address],
        fail_silently=False,
    )


def _send_sms(entry: NotificationQueueEntry):
    # Intégration réelle (Twilio, Digicel, MTN Mobile Money Gateway, etc.)
    # à brancher ici. Volontairement laissé en stub explicite.
    raise NotImplementedError("Passerelle SMS non configurée pour cet environnement.")


def _send_push(entry: NotificationQueueEntry):
    # Intégration réelle (Firebase Cloud Messaging, APNs, etc.) à brancher ici.
    raise NotImplementedError("Passerelle Push non configurée pour cet environnement.")


@shared_task
def retry_failed_notifications():
    """
    Tâche périodique (Celery beat) : relance les entrées 'failed' de
    moins de 24h, utile après une coupure réseau prolongée à l'école.
    """
    cutoff = timezone.now() - timezone.timedelta(hours=24)
    stuck = NotificationQueueEntry.objects.filter(
        status="failed", created_at__gte=cutoff
    )
    for entry in stuck:
        entry.status = "pending"
        entry.retry_count = 0
        entry.save(update_fields=["status", "retry_count"])
        send_queued_notification.delay(str(entry.id))
