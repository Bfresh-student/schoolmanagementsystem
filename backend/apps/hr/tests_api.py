import tempfile
from decimal import Decimal
from datetime import date

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.hr.models import (
    Contract,
    ContractStatus,
    ContractType,
    Currency,
    Leave,
    LeaveStatus,
    LeaveType,
    Salary,
    PerformanceEvaluation,
    HRDocument,
    AuditLog,
)
from apps.teachers.models import Teacher
from django.contrib.auth import get_user_model

@pytest.fixture
def hr_staff_user(db):
    """Create a user with an HR staff role (admin or hr)."""
    user = get_user_model().objects.create_user(
        email="hrstaff@example.com",
        password="testpass123",
    )
    setattr(user, "role", "hr")
    user.save()
    return user

@pytest.fixture
def api_client(hr_staff_user):
    client = APIClient()
    client.force_authenticate(user=hr_staff_user)
    return client

@pytest.fixture
def teacher(db):
    user = get_user_model().objects.create_user(
        email="teacher@example.com",
        password="testpass123",
    )
    setattr(user, "role", "teacher")
    user.save()
    return Teacher.objects.create(user=user, teacher_id="T001", hire_date=date(2022, 1, 1))

@pytest.fixture
def leave_type(db):
    return LeaveType.objects.create(name="Congé annuel", days_per_year=Decimal("12"), is_paid=True)

def test_contract_termination(api_client, teacher):
    contract = Contract.objects.create(
        teacher=teacher,
        status=ContractStatus.ACTIVE,
        contract_type=ContractType.PERMANENT,
        start_date=date(2022, 1, 1),
        monthly_salary=Decimal("1000"),
        currency=Currency.USD,
    )
    url = reverse("hr:contract-terminate", args=[contract.id])
    data = {"termination_date": "2023-01-01", "reason": "Fin de mission"}
    response = api_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_200_OK
    contract.refresh_from_db()
    assert contract.status == ContractStatus.TERMINATED

def test_salary_mark_paid_and_payslip(api_client, teacher, tmp_path):
    salary = Salary.objects.create(
        teacher=teacher,
        contract=None,
        pay_period_start=date(2023, 1, 1),
        pay_period_end=date(2023, 1, 31),
        base_salary=Decimal("2000"),
        bonuses=Decimal("0"),
        deductions=Decimal("0"),
    )
    # Mark as paid
    url = reverse("hr:salary-mark-paid", args=[salary.id])
    data = {"payment_date": "2023-02-05", "payment_reference": "REF123"}
    resp = api_client.post(url, data, format="json")
    assert resp.status_code == status.HTTP_200_OK
    salary.refresh_from_db()
    assert salary.status == "PAID"
    # Create dummy payslip file
    payslip_path = tmp_path / "payslip.pdf"
    payslip_path.write_bytes(b"%PDF-1.4 dummy content")
    with open(payslip_path, "rb") as f:
        salary.payslip_file.save(payslip_path.name, f)
    # Retrieve payslip
    url = reverse("hr:salary-payslip", args=[salary.id])
    resp = api_client.get(url)
    assert resp.status_code == status.HTTP_200_OK
    assert resp.get("Content-Type") == "application/pdf"

def test_leave_approve_reject_balance(api_client, teacher, leave_type):
    leave = Leave.objects.create(
        teacher=teacher,
        leave_type=leave_type,
        start_date=date(2023, 5, 1),
        end_date=date(2023, 5, 5),
        days_used=Decimal("5"),
        status=LeaveStatus.PENDING,
    )
    # Approve
    url = reverse("hr:leave-approve", args=[leave.id])
    resp = api_client.post(url, {}, format="json")
    assert resp.status_code == status.HTTP_200_OK
    leave.refresh_from_db()
    assert leave.status == LeaveStatus.APPROVED
    # Reject a new pending leave
    leave2 = Leave.objects.create(
        teacher=teacher,
        leave_type=leave_type,
        start_date=date(2023, 6, 1),
        end_date=date(2023, 6, 3),
        days_used=Decimal("3"),
        status=LeaveStatus.PENDING,
    )
    url = reverse("hr:leave-reject", args=[leave2.id])
    resp = api_client.post(url, {}, format="json")
    assert resp.status_code == status.HTTP_200_OK
    leave2.refresh_from_db()
    assert leave2.status == LeaveStatus.REJECTED
    # Balance endpoint
    url = reverse("hr:leave-balance")
    resp = api_client.get(url)
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert any(item["leave_type"] == leave_type.name for item in data)

def test_hr_document_creation(api_client, teacher):
    dummy_file = tempfile.NamedTemporaryFile(suffix=".txt")
    dummy_file.write(b"Dummy content")
    dummy_file.seek(0)
    data = {
        "teacher": teacher.id,
        "document_type": "CERTIFICATE",
        "file": dummy_file,
        "expiry_date": "2025-12-31",
    }
    url = reverse("hr:hr-document-list")
    resp = api_client.post(url, data, format="multipart")
    assert resp.status_code == status.HTTP_201_CREATED
    doc_id = resp.json()["id"]
    doc = HRDocument.objects.get(id=doc_id)
    assert doc.status == "PENDING"

def test_performance_evaluation_acknowledge(api_client, teacher, hr_staff_user):
    evaluator = hr_staff_user
    evaluation = PerformanceEvaluation.objects.create(
        teacher=teacher,
        evaluator=evaluator,
        evaluation_date=date.today(),
        evaluation_period_start=date(2023, 1, 1),
        evaluation_period_end=date(2023, 12, 31),
        rating=5,
        criteria_scores={"quality": 5},
    )
    url = reverse("hr:evaluation-acknowledge", args=[evaluation.id])
    resp = api_client.post(url, {"comments": "Merci"}, format="json")
    assert resp.status_code == status.HTTP_200_OK
    evaluation.refresh_from_db()
    assert evaluation.teacher_acknowledged is True

def test_audit_log_access(api_client, teacher):
    url = reverse("hr:hr-audit-log-list")
    resp = api_client.get(url)
    assert resp.status_code == status.HTTP_200_OK
    # Non‑HR user should be forbidden
    user = get_user_model().objects.create_user(email="nonhr@example.com", password="test")
    setattr(user, "role", "teacher")
    user.save()
    client2 = APIClient()
    client2.force_authenticate(user=user)
    resp2 = client2.get(url)
    assert resp2.status_code == status.HTTP_403_FORBIDDEN
