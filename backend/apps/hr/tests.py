"""
Tests de base pour l'application HR.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
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
        user = get_user_model().objects.create_user(
            email=f"prof_hr_{self.__class__.__name__.lower()}@ecole.ht", password="testpass123"
        )
        self.teacher = Teacher.objects.create(
            user=user, teacher_id=f"PROF-HR-{self.__class__.__name__[:5].upper()}", hire_date=date(2022, 1, 1)
        )


class ContractTests(HRBaseTestCase):
    def test_cannot_have_two_active_contracts(self):
        Contract.objects.create(
            teacher=self.teacher,
            status=ContractStatus.ACTIVE,
            contract_type=ContractType.PERMANENT,
            start_date=date(2026, 1, 1),
            monthly_salary=Decimal("1000.00")
        )
        with self.assertRaises(ValidationError):
            second = Contract(
                teacher=self.teacher,
                status=ContractStatus.ACTIVE,
                contract_type=ContractType.PERMANENT,
                start_date=date(2026, 1, 1),
                monthly_salary=Decimal("1000.00")
            )
            second.full_clean()
        self.skipTest("À compléter avec les factories Teacher/User du projet.")

    def test_end_date_before_start_date_rejected(self):
        self.skipTest("À compléter avec les factories Teacher/User du projet.")


class SalaryTests(HRBaseTestCase):
    def test_net_salary_is_computed_on_save(self):
        salary = Salary(teacher=self.teacher, pay_period_start=date(2026, 1, 1),
                         pay_period_end=date(2026, 1, 31), base_salary=Decimal("1000"),
                         bonuses=Decimal("50"), deductions=Decimal("20"))
        salary.save()
        self.assertEqual(salary.net_salary, Decimal("1030"))
        self.skipTest("À compléter avec les factories Teacher/User du projet.")

    def test_unique_salary_per_period(self):
        self.skipTest("À compléter avec les factories Teacher/User du projet.")


class LeaveTests(HRBaseTestCase):
    def test_remaining_balance_subtracts_approved_leaves(self):
        self.skipTest("À compléter avec les factories Teacher/User du projet.")

    def test_overlapping_leaves_rejected(self):
        self.skipTest("À compléter avec les factories Teacher/User du projet.")

    def test_leave_exceeding_balance_rejected(self):
        self.skipTest("À compléter avec les factories Teacher/User du projet.")
