"""
Tests de la couche service Finance.
"""
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase

from apps.users.models import User
from apps.students.models import Student
from apps.finance.models import Invoice, Payment, PaymentMethod
from apps.finance.services import PaymentError, PaymentService


class InvoiceStatusTests(TestCase):
    def setUp(self):
        self.method, _ = PaymentMethod.objects.get_or_create(
            code=PaymentMethod.Code.CASH,
            defaults={"name": "Espèces", "is_online": False}
        )

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

        PaymentService.record_manual(
            invoice, self.method, Decimal("200.00")
        )
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PARTIALLY_PAID)
        self.assertEqual(invoice.balance_due, Decimal("300.00"))

        PaymentService.record_manual(
            invoice, self.method, Decimal("300.00")
        )
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PAID)
        self.assertEqual(invoice.balance_due, Decimal("0.00"))

    def test_cannot_overpay_invoice(self):
        invoice = self._make_invoice("100.00")
        with self.assertRaises(PaymentError):
            PaymentService.record_manual(invoice, self.method, Decimal("150.00"))

    def test_void_payment_restores_invoice_balance(self):
        invoice = self._make_invoice("100.00")
        p = PaymentService.record_manual(invoice, self.method, Decimal("50.00"))
        invoice.refresh_from_db()
        self.assertEqual(invoice.balance_due, Decimal("50.00"))

        PaymentService.void(p, voided_by=None, reason="Erreur de saisie")
        invoice.refresh_from_db()
        self.assertEqual(invoice.balance_due, Decimal("100.00"))
        self.assertEqual(invoice.status, Invoice.Status.PENDING)

