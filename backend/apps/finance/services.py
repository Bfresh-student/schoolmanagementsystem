"""
Couche service pour l'app Finance.

Toute la logique métier (génération de numéros, transitions de statut,
traitement des webhooks des passerelles) vit ici plutôt que dans les vues,
pour rester testable et réutilisable depuis Celery ou l'admin.
"""
import logging
from datetime import date

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Invoice, Payment, PaymentMethod, Receipt, WebhookEvent

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Numérotation
# ---------------------------------------------------------------------------

def _next_sequence(model, field, prefix):
    """Numéro séquentiel simple par année : PREFIX-YYYY-000001.
    Utilise select_for_update pour éviter les collisions en cas d'accès concurrent."""
    year = timezone.now().year
    with transaction.atomic():
        last = (
            model.objects.select_for_update()
            .filter(**{f"{field}__startswith": f"{prefix}-{year}-"})
            .order_by(f"-{field}")
            .first()
        )
        if last:
            last_seq = int(getattr(last, field).split("-")[-1])
        else:
            last_seq = 0
        return f"{prefix}-{year}-{last_seq + 1:06d}"


def generate_invoice_number():
    return _next_sequence(Invoice, "invoice_number", "INV")


def generate_receipt_number():
    return _next_sequence(Receipt, "receipt_number", "RCT")


# ---------------------------------------------------------------------------
# Factures
# ---------------------------------------------------------------------------

class InvoiceService:

    @staticmethod
    @transaction.atomic
    def create_for_inscription(inscription, amount, due_in_days=None):
        """Crée automatiquement une facture à l'approbation d'une inscription
        (déclenché par le signal dans signals.py)."""
        due_in_days = due_in_days or getattr(settings, "FINANCE_DEFAULT_DUE_DAYS", 14)
        invoice = Invoice.objects.create(
            invoice_number=generate_invoice_number(),
            inscription=inscription,
            student=inscription.student,
            amount=amount,
            due_date=date.today() + timezone.timedelta(days=due_in_days),
        )
        logger.info("Facture %s créée pour l'inscription %s", invoice.invoice_number, inscription.id)
        return invoice

    @staticmethod
    def mark_overdue_invoices():
        """À exécuter quotidiennement via Celery Beat."""
        qs = Invoice.objects.filter(
            status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIALLY_PAID],
            due_date__lt=date.today(),
        )
        count = qs.update(status=Invoice.Status.OVERDUE, updated_at=timezone.now())
        logger.info("%s facture(s) marquée(s) en retard", count)
        return count


# ---------------------------------------------------------------------------
# Paiements
# ---------------------------------------------------------------------------

class PaymentError(Exception):
    pass


class PaymentService:

    @staticmethod
    @transaction.atomic
    def initiate(invoice: Invoice, payment_method: PaymentMethod, amount, idempotency_key,
                 user=None, gateway_reference="", synced=True):
        """Crée un paiement en attente. Pour les méthodes en ligne (Stripe/PayPal),
        gateway_reference est l'id du PaymentIntent/order créé côté client.
        Pour les méthodes hors-ligne (espèces/virement), le paiement peut être
        immédiatement complété par un admin via `confirm_manual`."""
        if invoice.status == Invoice.Status.CANCELLED:
            raise PaymentError("Impossible de payer une facture annulée.")
        if amount > invoice.balance_due:
            raise PaymentError("Le montant dépasse le solde dû de la facture.")

        payment, created = Payment.objects.get_or_create(
            idempotency_key=idempotency_key,
            defaults=dict(
                invoice=invoice,
                student=invoice.student,
                payment_method=payment_method,
                amount=amount,
                status=Payment.Status.PENDING,
                gateway_reference=gateway_reference,
                initiated_by=user,
                synced=synced,
            ),
        )
        return payment

    @staticmethod
    @transaction.atomic
    def confirm_manual(payment: Payment, confirmed_by):
        """Confirmation manuelle par un admin — cash ou virement bancaire."""
        if payment.payment_method.code in (PaymentMethod.Code.STRIPE, PaymentMethod.Code.PAYPAL):
            raise PaymentError("Les paiements en ligne se confirment automatiquement via webhook.")
        return PaymentService._complete(payment)

    @staticmethod
    @transaction.atomic
    def _complete(payment: Payment):
        if payment.status == Payment.Status.COMPLETED:
            return payment  # idempotent
        payment.status = Payment.Status.COMPLETED
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "paid_at", "updated_at"])

        invoice = Invoice.objects.select_for_update().get(pk=payment.invoice_id)
        invoice.amount_paid = invoice.amount_paid + payment.amount
        invoice.recompute_status(save=True)

        ReceiptService.generate(payment)
        _notify_payment_completed(payment)
        return payment

    @staticmethod
    @transaction.atomic
    def _fail(payment: Payment, reason: str):
        payment.status = Payment.Status.FAILED
        payment.failure_reason = reason
        payment.save(update_fields=["status", "failure_reason", "updated_at"])
        return payment

    # -- Webhooks -----------------------------------------------------------

    @staticmethod
    def handle_stripe_event(event: dict):
        return PaymentService._handle_gateway_event(
            provider=WebhookEvent.Provider.STRIPE,
            external_event_id=event.get("id"),
            payload=event,
            reference_extractor=lambda e: e["data"]["object"]["id"],
            success_types={"payment_intent.succeeded", "checkout.session.completed"},
            failure_types={"payment_intent.payment_failed"},
            event_type=event.get("type"),
        )

    @staticmethod
    def handle_paypal_event(event: dict):
        return PaymentService._handle_gateway_event(
            provider=WebhookEvent.Provider.PAYPAL,
            external_event_id=event.get("id"),
            payload=event,
            reference_extractor=lambda e: e["resource"]["id"],
            success_types={"PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"},
            failure_types={"PAYMENT.CAPTURE.DENIED"},
            event_type=event.get("event_type"),
        )

    @staticmethod
    def handle_mobile_money_event(event: dict):
        """Digicel/MTN n'ont généralement pas de webhook standardisé — ce
        handler suppose une charge utile normalisée {id, status, reference}
        déjà adaptée par l'intégration spécifique au fournisseur."""
        return PaymentService._handle_gateway_event(
            provider=WebhookEvent.Provider.MOBILE_MONEY,
            external_event_id=event.get("id"),
            payload=event,
            reference_extractor=lambda e: e["reference"],
            success_types={"success"},
            failure_types={"failed"},
            event_type=event.get("status"),
        )

    @staticmethod
    @transaction.atomic
    def _handle_gateway_event(provider, external_event_id, payload, reference_extractor,
                               success_types, failure_types, event_type):
        if not external_event_id:
            raise PaymentError("Événement webhook sans identifiant.")

        webhook_event, created = WebhookEvent.objects.get_or_create(
            provider=provider,
            external_event_id=external_event_id,
            defaults=dict(payload=payload),
        )
        if not created and webhook_event.processed:
            # Déjà traité — la passerelle réémet parfois le même événement.
            return webhook_event

        try:
            reference = reference_extractor(payload)
            payment = Payment.objects.select_for_update().get(gateway_reference=reference)

            if event_type in success_types:
                PaymentService._complete(payment)
            elif event_type in failure_types:
                PaymentService._fail(payment, reason=f"{provider}: {event_type}")

            webhook_event.processed = True
            webhook_event.save(update_fields=["processed"])
        except Payment.DoesNotExist:
            webhook_event.error_message = f"Aucun paiement pour la référence extraite de {external_event_id}"
            webhook_event.save(update_fields=["error_message"])
            logger.warning(webhook_event.error_message)
        except Exception as exc:  # pragma: no cover - filet de sécurité
            webhook_event.error_message = str(exc)
            webhook_event.save(update_fields=["error_message"])
            logger.exception("Erreur de traitement du webhook %s", external_event_id)
            raise

        return webhook_event


# ---------------------------------------------------------------------------
# Reçus
# ---------------------------------------------------------------------------

class ReceiptService:

    @staticmethod
    def generate(payment: Payment):
        if hasattr(payment, "receipt"):
            return payment.receipt
        receipt = Receipt.objects.create(
            payment=payment,
            receipt_number=generate_receipt_number(),
        )
        # La génération du PDF proprement dite est déléguée à une tâche Celery
        # asynchrone (rendu + upload S3) pour ne pas bloquer le webhook.
        from .tasks import render_receipt_pdf
        render_receipt_pdf.delay(str(receipt.id))
        return receipt


def _notify_payment_completed(payment: Payment):
    """Déclenche les notifications (App 14). Import tardif pour éviter une
    dépendance dure entre apps si 'notifications' n'est pas installée."""
    try:
        from notifications.services import trigger_notification
    except ImportError:
        logger.debug("App notifications non installée — notification de paiement ignorée.")
        return
    trigger_notification(
        trigger_type="payment_received",
        recipient=payment.student.user,
        context={
            "amount": str(payment.amount),
            "invoice_number": payment.invoice.invoice_number,
        },
    )
