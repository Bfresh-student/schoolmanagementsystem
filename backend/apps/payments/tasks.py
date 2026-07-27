import logging
from celery import shared_task
from .models import Payment, PaymentStatus

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_payment_task(self, payment_id):
    """Processes a pending payment in the background."""
    try:
        payment = Payment.objects.get(pk=payment_id)
    except Payment.DoesNotExist:
        logger.error("Payment %s not found for background processing", payment_id)
        return

    try:
        # Placeholder processing logic (e.g. gateway verification or receipt generation)
        if payment.status == PaymentStatus.PENDING:
            payment.status = PaymentStatus.COMPLETED
            payment.synced = True
            payment.save(update_fields=["status", "synced", "updated_at"])
            logger.info("Payment %s marked as COMPLETED via task", payment_id)
            
            # Trigger notification task
            notify_payment_status_task.delay(payment_id)
    except Exception as exc:
        logger.exception("Failed to process payment %s", payment_id)
        raise self.retry(exc=exc)


@shared_task
def notify_payment_status_task(payment_id):
    """Sends notification regarding payment status update."""
    try:
        payment = Payment.objects.select_related("student__user").get(pk=payment_id)
    except Payment.DoesNotExist:
        logger.error("Payment %s not found for notification", payment_id)
        return False

    try:
        from apps.notifications.services import trigger_notification
        trigger_notification(
            trigger_type="payment_status_update",
            recipient=payment.student.user,
            context={
                "payment_id": payment.id,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "status": payment.status,
            },
        )
        logger.info("Payment status notification dispatched for payment %s", payment_id)
        return True
    except ImportError:
        logger.debug("Notifications app missing/unimportable; skipping notification.")
        return False
    except Exception:
        logger.exception("Failed sending notification for payment %s", payment_id)
        return False
