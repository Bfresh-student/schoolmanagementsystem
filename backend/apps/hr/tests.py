"""
Tests de base pour l'application HR.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.hr.models import (
    Contract,
    ContractStatus,
    ContractType,
    Currency,
    Leave,
    LeaveStatus,
    LeaveType,
    Salary,
)

from apps.teachers.models import Teacher


class HRBaseTestCase(TestCase):
    def setUp(self):
        # Create a user and associated teacher profile
        user = get_user_model().objects.create_user(
            email=f"prof_hr_{self.__class__.__name__.lower()}@ecole.ht",
            password="testpass123",
        )
        self.teacher = Teacher.objects.create(
            user=user,
            teacher_id=f"PROF-HR-{self.__class__.__name__[:5].upper()}",
            hire_date=date(2022, 1, 1),
        )

        # Create a generic leave type for reuse in leave tests
        self.leave_type = LeaveType.objects.create(name="Congé annuel", days_per_year=Decimal("12"), is_paid=True)


class ContractTests(HRBaseTestCase):
    def test_cannot_have_two_active_contracts(self):
        Contract.objects.create(
            teacher=self.teacher,
            status=ContractStatus.ACTIVE,
            contract_type=ContractType.PERMANENT,
            start_date=date(2026, 1, 1),
            monthly_salary=Decimal("1000.00"),
        )
        # Attempt to create a second active contract for the same teacher
        second = Contract(
            teacher=self.teacher,
            status=ContractStatus.ACTIVE,
            contract_type=ContractType.PERMANENT,
            start_date=date(2026, 2, 1),
            monthly_salary=Decimal("1200.00"),
        )
        with self.assertRaises(ValidationError):
            second.full_clean()

    def test_end_date_before_start_date_rejected(self):
        contract = Contract(
            teacher=self.teacher,
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
            teacher=self.teacher,
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
            teacher=self.teacher,
            pay_period_start=date(2026, 2, 1),
            pay_period_end=date(2026, 2, 28),
            base_salary=Decimal("1100"),
            bonuses=Decimal("0"),
            deductions=Decimal("0"),
        )
        # Creating another salary with the same teacher and period should raise an IntegrityError
        with self.assertRaises(IntegrityError):
            Salary.objects.create(
                teacher=self.teacher,
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
            teacher=self.teacher,
            leave_type=self.leave_type,
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 4),
            days_used=Decimal("4"),
            status=LeaveStatus.APPROVED,
        )
        # Remaining balance for the year should be days_per_year - used
        remaining = Leave.remaining_balance(self.teacher, self.leave_type, 2026)
        self.assertEqual(remaining, Decimal("8"))

    def test_overlapping_leaves_rejected(self):
        # First leave (pending)
        Leave.objects.create(
            teacher=self.teacher,
            leave_type=self.leave_type,
            start_date=date(2026, 4, 10),
            end_date=date(2026, 4, 15),
            days_used=Decimal("5"),
            status=LeaveStatus.PENDING,
        )
        # Overlapping leave should raise ValidationError on clean
        overlapping = Leave(
            teacher=self.teacher,
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
            teacher=self.teacher,
            leave_type=self.leave_type,
            start_date=date(2026, 5, 1),
            end_date=date(2026, 5, 6),
            days_used=Decimal("6"),
            status=LeaveStatus.APPROVED,
        )
        # Attempt to create a new pending leave that would exceed the remaining 4 days
        excessive_leave = Leave(
            teacher=self.teacher,
            leave_type=self.leave_type,
            start_date=date(2026, 5, 10),
            end_date=date(2026, 5, 15),
            days_used=Decimal("5"),
            status=LeaveStatus.PENDING,
        )
        with self.assertRaises(ValidationError):
            excessive_leave.full_clean()
