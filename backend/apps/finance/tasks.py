import logging

from celery import shared_task
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def render_receipt_pdf(self, receipt_id):
    """Génère le PDF du reçu et l'upload vers le stockage (S3 en prod).
    Utilise weasyprint/xhtml2pdf — à ajouter aux dépendances du projet."""
    from django.core.files.base import ContentFile

    from .models import Receipt

    try:
        receipt = Receipt.objects.select_related("payment__invoice__student__user").get(pk=receipt_id)
    except Receipt.DoesNotExist:
        logger.error("Reçu %s introuvable pour génération PDF", receipt_id)
        return

    try:
        from weasyprint import HTML  # import tardif : dépendance optionnelle

        html = render_to_string(
            "finance/receipt_pdf.html",
            {"receipt": receipt, "payment": receipt.payment, "invoice": receipt.payment.invoice},
        )
        pdf_bytes = HTML(string=html).write_pdf()

        from django.core.files.storage import default_storage

        path = f"receipts/{receipt.receipt_number}.pdf"
        default_storage.save(path, ContentFile(pdf_bytes))
        receipt.pdf_path = path
        receipt.save(update_fields=["pdf_path"])
        logger.info("PDF généré pour le reçu %s", receipt.receipt_number)
    except ImportError:
        logger.warning("Weasyprint non disponible pour la génération PDF du reçu %s", receipt_id)
        return
    except Exception as exc:
        logger.exception("Échec génération PDF reçu %s", receipt_id)
        raise self.retry(exc=exc)


@shared_task
def mark_overdue_invoices_task():
    from .services import InvoiceService

    return InvoiceService.mark_overdue_invoices()


@shared_task
def send_payment_reminders():
    """Rappelle aux étudiants les factures qui approchent de l'échéance
    (J-3), à planifier quotidiennement via Celery Beat."""
    from datetime import date, timedelta

    from .models import Invoice
    from .services import _notify_payment_completed  # noqa (référence pour cohérence du module)

    target_date = date.today() + timedelta(days=3)
    invoices = Invoice.objects.filter(
        status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIALLY_PAID],
        due_date=target_date,
    ).select_related("student__user")

    try:
        from notifications.services import trigger_notification
    except ImportError:
        logger.debug("App notifications non installée — rappels ignorés.")
        return 0

    count = 0
    for invoice in invoices:
        trigger_notification(
            trigger_type="invoice_due_soon",
            recipient=invoice.student.user,
            context={"invoice_number": invoice.invoice_number, "due_date": str(invoice.due_date)},
        )
        count += 1
    return count
