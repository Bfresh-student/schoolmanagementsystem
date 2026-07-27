"""
Tests de la couche service. Suppose que les apps 'students' et
'inscriptions' du projet existent avec des factories/fixtures équivalentes
à celles utilisées ci-dessous — à adapter aux factories réelles du projet
(factory_boy recommandé).
"""
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase

from apps.users.models import User
from apps.students.models import Student
from apps.finance.models import Invoice, Payment, PaymentMethod, WebhookEvent
from apps.finance.services import PaymentError, PaymentService


class InvoiceStatusTests(TestCase):
    def setUp(self):
        self.method = PaymentMethod.objects.create(name="Espèces", code=PaymentMethod.Code.CASH, is_online=False)

    def _make_invoice(self, amount="500.00"):
        user = User.objects.create_user(email=f"fin_{Invoice.objects.count()}@test.com", password="password123")
        student = Student.objects.create(user=user)
        return Invoice.objects.create(
            invoice_number=f"INV-TEST-{Invoice.objects.count() + 1:06d}",
            student=student,
            amount=Decimal(amount),
            due_date=date.today() + timedelta(days=7),
        )

    def test_partial_then_full_payment_updates_status(self):
        invoice = self._make_invoice("500.00")

        p1 = PaymentService.initiate(
            invoice, self.method, Decimal("200.00"), idempotency_key="key-1"
        )
        PaymentService.confirm_manual(p1, confirmed_by=None)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PARTIALLY_PAID)
        self.assertEqual(invoice.balance_due, Decimal("300.00"))

        p2 = PaymentService.initiate(
            invoice, self.method, Decimal("300.00"), idempotency_key="key-2"
        )
        PaymentService.confirm_manual(p2, confirmed_by=None)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PAID)
        self.assertEqual(invoice.balance_due, Decimal("0.00"))

    def test_cannot_overpay_invoice(self):
        invoice = self._make_invoice("100.00")
        with self.assertRaises(PaymentError):
            PaymentService.initiate(invoice, self.method, Decimal("150.00"), idempotency_key="key-3")

    def test_idempotency_key_prevents_duplicate_payment(self):
        invoice = self._make_invoice("100.00")
        p1 = PaymentService.initiate(invoice, self.method, Decimal("50.00"), idempotency_key="dup")
        p2 = PaymentService.initiate(invoice, self.method, Decimal("50.00"), idempotency_key="dup")
        self.assertEqual(p1.id, p2.id)
        self.assertEqual(Payment.objects.filter(idempotency_key="dup").count(), 1)


class StripeWebhookIdempotenceTests(TestCase):
    def test_same_event_processed_only_once(self):
        method = PaymentMethod.objects.create(name="Carte", code=PaymentMethod.Code.STRIPE)
        # ... créer facture + paiement avec gateway_reference="pi_123" via une factory réelle
        event = {
            "id": "evt_123",
            "type": "payment_intent.succeeded",
            "data": {"object": {"id": "pi_123"}},
        }
        PaymentService.handle_stripe_event(event)
        PaymentService.handle_stripe_event(event)  # rejoué par Stripe
        self.assertEqual(WebhookEvent.objects.filter(external_event_id="evt_123").count(), 1)
