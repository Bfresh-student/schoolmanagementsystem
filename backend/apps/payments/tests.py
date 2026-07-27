import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from apps.users.models import User
from apps.students.models import Student
from apps.payments.models import Payment, PaymentStatus, PaymentMethod


@pytest.mark.django_db
class TestPaymentAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="student_pay@test.com", password="password123", role="STUDENT", first_name="Jean", last_name="Dupont"
        )
        self.student = Student.objects.create(user=self.user)

    def test_create_payment(self):
        payment = Payment.objects.create(
            student=self.student,
            amount=Decimal("150.00"),
            currency="HTG",
            payment_method=PaymentMethod.CASH,
            status=PaymentStatus.PENDING,
        )
        assert payment.id is not None
        assert payment.status == PaymentStatus.PENDING
        assert payment.student == self.student

    def test_payment_endpoint_list(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/payments/payments/")
        assert response.status_code == 200
