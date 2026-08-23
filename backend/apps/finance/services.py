"""
Couche service pour l'app Finance.

Toute la logique métier (génération de numéros, transitions de statut)
vit ici plutôt que dans les vues, pour rester testable et réutilisable
depuis Celery ou l'admin.

⚠️ CHANGEMENT : le système ne gère plus aucun paiement en ligne (Stripe,
PayPal, mobile money via webhook). Tous les paiements sont saisis
manuellement par le staff (espèces, virement, MonCash/NatCash physiquement
constaté) et marqués COMPLETED immédiatement — il n'y a plus d'état
"pending" en attente de confirmation externe, donc plus de webhook à
recevoir ni à traiter.
"""
import logging
from datetime import date

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import Invoice, Payment, PaymentMethod, Receipt

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Numérotation
# ---------------------------------------------------------------------------

def _next_sequence(model, field, prefix):
    """Numéro séquentiel simple par année : PREFIX-YYYY-000001.
    Utilise select_for_update pour éviter les collisions en cas d'accès concurrent.

    LIMITE CONNUE : select_for_update() ne verrouille que les lignes déjà
    existantes. Pour la toute première facture/reçu d'une année donnée, il
    n'y a rien à verrouiller : deux transactions concurrentes peuvent
    calculer le même numéro. C'est géré en aval par
    _create_with_sequential_number(), qui retente avec un nouveau numéro
    si l'INSERT échoue sur la contrainte unique."""
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


def _create_with_sequential_number(model, field, prefix, build_kwargs, max_attempts=5):
    """
    Crée un objet portant un numéro séquentiel unique (INV-YYYY-NNNNNN /
    RCT-YYYY-NNNNNN), avec retry en cas de collision.

    Corrige la faille de _next_sequence() : si l'INSERT échoue sur la
    contrainte unique (deux créations concurrentes ayant calculé le même
    numéro faute de ligne à verrouiller), on recalcule un nouveau numéro et
    on retente, au lieu de laisser planter la requête HTTP en cours
    (ce qui, sans ce fix, aurait empêché purement et simplement la
    génération de la facture pour l'inscription concernée).

    `build_kwargs(number)` doit renvoyer le dict de kwargs pour
    `model.objects.create(**kwargs)`, en y incluant `number` sous la bonne
    clé (ex: {"invoice_number": number, ...}).
    """
    last_error = None
    for attempt in range(1, max_attempts + 1):
        number = _next_sequence(model, field, prefix)
        try:
            with transaction.atomic():
                return model.objects.create(**build_kwargs(number))
        except IntegrityError as exc:
            last_error = exc
            logger.warning(
                "Collision sur %s=%s (tentative %s/%s) — nouvelle tentative...",
                field, number, attempt, max_attempts,
            )
            continue
    logger.error("Échec définitif de génération de %s après %s tentatives", field, max_attempts)
    raise last_error


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
        due_date = date.today() + timezone.timedelta(days=due_in_days)

        invoice = _create_with_sequential_number(
            Invoice,
            "invoice_number",
            "INV",
            lambda number: dict(
                invoice_number=number,
                inscription=inscription,
                student=inscription.student,
                amount=amount,
                due_date=due_date,
            ),
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
# Paiements — SAISIE MANUELLE UNIQUEMENT (plus de passerelle en ligne)
# ---------------------------------------------------------------------------

class PaymentError(Exception):
    pass


class PaymentService:

    @staticmethod
    @transaction.atomic
    def record_manual(invoice: Invoice, payment_method: PaymentMethod, amount, user=None,
                      reference: str = "", paid_at=None):
        """
        Enregistre un paiement reçu en personne ou vérifié manuellement par
        le staff (espèces, virement bancaire, MonCash/NatCash physiquement
        confirmé) et le marque COMPLETED immédiatement : il n'y a plus de
        webhook ni de confirmation asynchrone à attendre.
        """
        # Verrouille la facture fraîchement relue pour empêcher deux
        # Verrouille la facture fraîchement relue pour empêcher deux
        # encaissements concurrents de dépasser le même solde.
        invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
        if invoice.status == Invoice.Status.CANCELLED:
            raise PaymentError("Impossible de payer une facture annulée.")
        if amount <= 0:
            raise PaymentError("Le montant doit être positif.")
        if amount > invoice.balance_due:
            raise PaymentError("Le montant dépasse le solde dû de la facture.")

        payment = Payment.objects.create(
            invoice=invoice,
            student=invoice.student,
            payment_method=payment_method,
            amount=amount,
            status=Payment.Status.COMPLETED,
            initiated_by=user,
            gateway_reference=reference,
            paid_at=paid_at or timezone.now(),
            synced=True,
            # idempotency_key n'est plus fourni ici : le champ a désormais
            # default=uuid.uuid4 au niveau du modèle, donc chaque paiement
            # reçoit automatiquement une clé unique même en saisie manuelle
            # (voir models.py).
        )

        invoice.amount_paid = invoice.amount_paid + payment.amount
        invoice.recompute_status(save=True)

        ReceiptService.generate(payment)
        _notify_payment_completed(payment)
        return payment

    @staticmethod
    @transaction.atomic
    def void(payment: Payment, voided_by, reason: str = ""):
        """
        Annule un paiement saisi par erreur (montant faux, doublon...).
        Remplace l'ancien `_fail` (qui gérait un échec de passerelle) par un
        équivalent adapté à la saisie manuelle : on retire le montant de la
        facture et on marque le paiement comme annulé (Payment.Status.CANCELLED,
        distinct de REFUNDED qui suppose qu'un encaissement réel a eu lieu
        puis a été remboursé).
        """
        if payment.status != Payment.Status.COMPLETED:
            raise PaymentError("Seul un paiement complété peut être annulé.")

        payment.status = Payment.Status.CANCELLED
        payment.failure_reason = reason or "Annulé manuellement par le staff."
        payment.save(update_fields=["status", "failure_reason", "updated_at"])

        invoice = Invoice.objects.select_for_update().get(pk=payment.invoice_id)
        invoice.amount_paid = invoice.amount_paid - payment.amount
        invoice.recompute_status(save=True)
        return payment


# ---------------------------------------------------------------------------
# Reçus
# ---------------------------------------------------------------------------

class ReceiptService:

    @staticmethod
    def generate(payment: Payment):
        if hasattr(payment, "receipt"):
            return payment.receipt
        receipt = _create_with_sequential_number(
            Receipt,
            "receipt_number",
            "RCT",
            lambda number: dict(payment=payment, receipt_number=number),
        )
        # La génération du PDF proprement dite est déléguée à une tâche Celery
        # asynchrone (rendu + upload S3) pour ne pas bloquer la requête.
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