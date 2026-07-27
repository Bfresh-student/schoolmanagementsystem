"""
Jobs périodiques RH (Celery beat).

À enregistrer dans CELERY_BEAT_SCHEDULE du projet, par ex. :

CELERY_BEAT_SCHEDULE = {
    "hr-check-expiring-documents": {
        "task": "hr.tasks.check_expiring_hr_documents",
        "schedule": crontab(hour=2, minute=0),  # tous les jours à 02h00
    },
    "hr-check-expiring-contracts": {
        "task": "hr.tasks.check_expiring_contracts",
        "schedule": crontab(hour=2, minute=15),
    },
    "hr-expire-past-contracts": {
        "task": "hr.tasks.expire_past_contracts",
        "schedule": crontab(hour=0, minute=5),
    },
}
"""

from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.hr.models import Contract, ContractStatus, HRDocument, HRDocumentStatus

# NOTE : le déclenchement effectif des notifications (email/push/in-app)
# passe par l'app Notification du système (NOTIFICATIONS / NOTIFICATION_QUEUE).
# Remplace `send_hr_notification` par l'appel réel à cette app, par ex.:
#   from notifications.services import send_notification


def send_hr_notification(recipient_user_id, title, content, trigger_type):
    """
    Placeholder — à brancher sur l'app Notification existante.
    """
    # from notifications.services import send_notification
    # send_notification(recipient_id=recipient_user_id, title=title,
    #                    content=content, trigger_type=trigger_type)
    pass


@shared_task
def check_expiring_hr_documents(warning_window_days: int = 30):
    documents = HRDocument.objects.exclude(expiry_date__isnull=True)
    updated = 0
    for doc in documents:
        previous_status = doc.status
        doc.refresh_status(warning_window_days=warning_window_days)
        if doc.status != previous_status:
            updated += 1
            teacher_user_id = doc.teacher.user_id
            if doc.status == HRDocumentStatus.EXPIRING_SOON:
                send_hr_notification(
                    teacher_user_id,
                    "Document expirant bientôt",
                    f"Votre document « {doc.get_document_type_display()} » expire le {doc.expiry_date}.",
                    "hr_document_expiring",
                )
            elif doc.status == HRDocumentStatus.EXPIRED:
                send_hr_notification(
                    teacher_user_id,
                    "Document expiré",
                    f"Votre document « {doc.get_document_type_display()} » a expiré le {doc.expiry_date}.",
                    "hr_document_expired",
                )
    return {"checked": documents.count(), "updated": updated}


@shared_task
def check_expiring_contracts(warning_window_days: int = 30):
    today = timezone.now().date()
    threshold = today + timedelta(days=warning_window_days)
    contracts = Contract.objects.filter(
        status=ContractStatus.ACTIVE,
        end_date__isnull=False,
        end_date__lte=threshold,
        end_date__gte=today,
    ).select_related("teacher")
    for contract in contracts:
        send_hr_notification(
            contract.teacher.user_id,
            "Contrat arrivant à échéance",
            f"Le contrat de {contract.teacher} expire le {contract.end_date}.",
            "contract_expiring",
        )
    return {"notified": contracts.count()}


@shared_task
def expire_past_contracts():
    today = timezone.now().date()
    qs = Contract.objects.filter(
        status=ContractStatus.ACTIVE, end_date__isnull=False, end_date__lt=today
    )
    count = qs.update(status=ContractStatus.EXPIRED)
    return {"expired": count}
