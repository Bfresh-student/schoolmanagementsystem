"""
Tests de base pour l'application HR.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.hr.models import (
    Contract,
    ContractStatus,
    ContractType,
    Currency,
    Employee,
    EmployeeStatus,
    Candidate,
    CandidateDocument,
    Leave,
    LeaveStatus,
    LeaveType,
    Salary,
)
from apps.teachers.models import Teacher
from apps.users.models import UserProfile
from rest_framework.test import APIClient


class HRBaseTestCase(TestCase):
    def setUp(self):
        # Create a user and associated employee profile
        user = get_user_model().objects.create_user(
            email=f"emp_hr_{self.__class__.__name__.lower()}@ecole.ht",
            password="testpass123",
        )
        self.employee = Employee.objects.create(
            user=user,
            employee_number=f"EMP-HR-{self.__class__.__name__[:5].upper()}",
            first_name="Jean",
            last_name="Dupont",
            job_title="Professeur",
            department="Informatique",
            hire_date=date(2022, 1, 1),
            status=EmployeeStatus.ACTIVE,
        )

        # Create a generic leave type for reuse in leave tests
        self.leave_type = LeaveType.objects.create(name="Congé annuel", days_per_year=Decimal("12"), is_paid=True)


class EmployeeAndAttendanceAPITests(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            email="admin-rh@ecole.ht", password="testpass123", role="ADMIN"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_professor_employee_creates_teacher_and_persists_gender(self):
        response = self.client.post("/api/v1/hr/employees/", {
            "employee_number": "EMP-TEST-TEACHER",
            "first_name": "Marie",
            "last_name": "Joseph",
            "gender": "Femme",
            "phone": "+50911112222",
            "email": "marie.joseph@ecole.ht",
            "address": "Port-au-Prince",
            "job_title": "Professeur",
            "department": "Professeurs",
            "hire_date": "2026-09-04",
            "status": "active",
            "monthly_salary": "50000.00",
            "monthly_bonus": "0.00",
        }, format="json")

        self.assertEqual(response.status_code, 201, response.data)
        employee = Employee.objects.get(employee_number="EMP-TEST-TEACHER")
        self.assertEqual(employee.gender, "Femme")
        self.assertIsNotNone(employee.user)
        self.assertEqual(employee.user.profile.gender, "F")
        self.assertTrue(Teacher.objects.filter(user=employee.user).exists())

    def test_attendance_is_saved_for_the_employee(self):
        employee = Employee.objects.create(
            employee_number="EMP-TEST-ATTENDANCE", first_name="Jean", last_name="Paul",
            job_title="Agent", department="Administration", hire_date=date(2026, 9, 4),
        )
        response = self.client.post("/api/v1/hr/attendances/", {
            "employee": employee.id, "date": "2026-09-04", "check_in_time": "08:00",
            "check_out_time": "16:00", "status": "present", "notes": "Test présence",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(employee.attendances.count(), 1)

    def test_recruitment_documents_are_persisted_and_linked_to_candidate(self):
        candidate_response = self.client.post("/api/v1/hr/candidates/", {
            "first_name": "Marie", "last_name": "Candidate",
            "email": "marie.candidate@ecole.ht", "position": "Secrétaire",
            "cv_file": SimpleUploadedFile("cv.pdf", b"cv content", content_type="application/pdf"),
        }, format="multipart")
        self.assertEqual(candidate_response.status_code, 201, candidate_response.data)
        candidate_id = candidate_response.data["id"]

        document_response = self.client.post("/api/v1/hr/candidate-documents/", {
            "candidate": candidate_id,
            "document_type": "diploma",
            "filename": "diplome.pdf",
            "file": SimpleUploadedFile("diplome.pdf", b"diploma content", content_type="application/pdf"),
        }, format="multipart")
        self.assertEqual(document_response.status_code, 201, document_response.data)
        self.assertTrue(CandidateDocument.objects.filter(candidate_id=candidate_id, filename="diplome.pdf").exists())

        detail = self.client.get(f"/api/v1/hr/candidates/{candidate_id}/")
        self.assertEqual(detail.status_code, 200, detail.data)
        self.assertEqual(len(detail.data["documents"]), 1)
        self.assertTrue(detail.data["cv_file"].endswith("cv.pdf"))


class ContractTests(HRBaseTestCase):
    def test_cannot_have_two_active_contracts(self):
        Contract.objects.create(
            employee=self.employee,
            status=ContractStatus.ACTIVE,
            contract_type=ContractType.PERMANENT,
            start_date=date(2026, 1, 1),
            monthly_salary=Decimal("1000.00"),
        )
        # Attempt to create a second active contract for the same employee
        second = Contract(
            employee=self.employee,
            status=ContractStatus.ACTIVE,
            contract_type=ContractType.PERMANENT,
            start_date=date(2026, 2, 1),
            monthly_salary=Decimal("1200.00"),
        )
        with self.assertRaises(ValidationError):
            second.full_clean()

    def test_end_date_before_start_date_rejected(self):
        contract = Contract(
            employee=self.employee,
            status=ContractStatus.DRAFT,
            contract_type=ContractType.TEMPORARY,
            start_date=date(2026, 5, 10),
            end_date=date(2026, 5, 5),
            monthly_salary=Decimal("800.00"),
        )
        with self.assertRaises(ValidationError):
            contract.full_clean()


class SalaryTests(HRBaseTestCase):
    def test_net_salary_is_computed_on_save(self):
        salary = Salary(
            employee=self.employee,
            pay_period_start=date(2026, 1, 1),
            pay_period_end=date(2026, 1, 31),
            base_salary=Decimal("1000"),
            bonuses=Decimal("50"),
            deductions=Decimal("20"),
        )
        salary.save()
        self.assertEqual(salary.net_salary, Decimal("1030"))

    def test_unique_salary_per_period(self):
        Salary.objects.create(
            employee=self.employee,
            pay_period_start=date(2026, 2, 1),
            pay_period_end=date(2026, 2, 28),
            base_salary=Decimal("1100"),
            bonuses=Decimal("0"),
            deductions=Decimal("0"),
        )
        # Creating another salary with the same employee and period should raise an IntegrityError
        with self.assertRaises(IntegrityError):
            Salary.objects.create(
                employee=self.employee,
                pay_period_start=date(2026, 2, 1),
                pay_period_end=date(2026, 2, 28),
                base_salary=Decimal("1200"),
                bonuses=Decimal("0"),
                deductions=Decimal("0"),
            )


class LeaveTests(HRBaseTestCase):
    def test_remaining_balance_subtracts_approved_leaves(self):
        # Create an approved leave consuming 4 days
        approved_leave = Leave.objects.create(
            employee=self.employee,
            leave_type=self.leave_type,
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 4),
            days_used=Decimal("4"),
            status=LeaveStatus.APPROVED,
        )
        # Remaining balance for the year should be days_per_year - used
        remaining = Leave.remaining_balance(self.employee, self.leave_type, 2026)
        self.assertEqual(remaining, Decimal("8"))

    def test_overlapping_leaves_rejected(self):
        # First leave (pending)
        Leave.objects.create(
            employee=self.employee,
            leave_type=self.leave_type,
            start_date=date(2026, 4, 10),
            end_date=date(2026, 4, 15),
            days_used=Decimal("5"),
            status=LeaveStatus.PENDING,
        )
        # Overlapping leave should raise ValidationError on clean
        overlapping = Leave(
            employee=self.employee,
            leave_type=self.leave_type,
            start_date=date(2026, 4, 14),
            end_date=date(2026, 4, 20),
            days_used=Decimal("6"),
            status=LeaveStatus.PENDING,
        )
        with self.assertRaises(ValidationError):
            overlapping.full_clean()

    def test_leave_exceeding_balance_rejected(self):
        # Adjust leave type to have 10 days per year for this scenario
        self.leave_type.days_per_year = Decimal("10")
        self.leave_type.save()
        # Set up a leave type with 10 days per year and an approved leave of 6 days
        Leave.objects.create(
            employee=self.employee,
            leave_type=self.leave_type,
            start_date=date(2026, 5, 1),
            end_date=date(2026, 5, 6),
            days_used=Decimal("6"),
            status=LeaveStatus.APPROVED,
        )
        # Attempt to create a new pending leave that would exceed the remaining 4 days
        excessive_leave = Leave(
            employee=self.employee,
            leave_type=self.leave_type,
            start_date=date(2026, 5, 10),
            end_date=date(2026, 5, 15),
            days_used=Decimal("5"),
            status=LeaveStatus.PENDING,
        )
        with self.assertRaises(ValidationError):
            excessive_leave.full_clean()

