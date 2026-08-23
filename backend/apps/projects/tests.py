import uuid
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.courses.models import Course
from apps.teachers.models import Teacher
from apps.students.models import Specialization

from apps.projects.models import (
    BusinessPlan,
    Company,
    Internship,
    Mentorship,
    Project,
    ProjectDeliverable,
    ProjectMember,
)

User = get_user_model()


class ProjectsModelTests(TestCase):
    def setUp(self):
        self.specialization = Specialization.objects.create(name="Informatique")
        user = User.objects.create_user(
            email="prof1@ecole.ht", password="testpass123"
        )
        self.teacher = Teacher.objects.create(
            user=user, teacher_id="PROF-001", hire_date=date(2022, 1, 1)
        )
        self.course = Course.objects.create(
            code="DEV-101",
            name="Dev Web",
            specialization=self.specialization,
            duration_weeks=10,
            fees_amount=20000,
        )

    def test_create_project_with_members(self):
        project = Project.objects.create(
            name="App e-commerce", course=self.course, teacher=self.teacher
        )
        ProjectMember.objects.create(project=project, student_id=1, role="leader")
        self.assertEqual(project.members_count, 1)

    def test_deliverable_is_late(self):
        from django.utils import timezone
        project = Project.objects.create(name="Projet X", course=self.course)
        deliverable = ProjectDeliverable.objects.create(
            project=project,
            name="Rapport final",
            due_date=timezone.now() - timedelta(days=1),
        )
        self.assertTrue(deliverable.is_late)

    def test_internship_creation(self):
        company = Company.objects.create(name="TechCorp")
        internship = Internship.objects.create(
            student_id=1,
            company=company,
            mentor=self.teacher,
            start_date=date(2024, 6, 1),
            end_date=date(2024, 8, 1),
        )
        self.assertEqual(internship.status, "pending")

    def test_mentorship_creation(self):
        mentorship = Mentorship.objects.create(
            student_id=1, teacher=self.teacher, start_date=date(2024, 1, 1)
        )
        self.assertEqual(mentorship.status, "active")

    def test_business_plan_creation(self):
        plan = BusinessPlan.objects.create(
            student_id=1, business_name="EcoMarket"
        )
        self.assertEqual(plan.status, "draft")


def timezone_now_minus_one_day():
    from django.utils import timezone

    return timezone.now() - timedelta(days=1)
