from datetime import date, timedelta

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.attendances.models import Attendance
from apps.courses.models import Course
from apps.finance.models import Invoice, Payment
from apps.grades.models import Grade
from apps.media_center.models import Article
from apps.projects.models import Project
from apps.students.models import Student
from apps.teachers.models import Teacher


def _month_starts(months=7):
    """Return the first day of each of the last ``months`` calendar months."""
    today = timezone.localdate()
    year, month = today.year, today.month
    result = []
    for _ in range(months):
        result.append(date(year, month, 1))
        month -= 1
        if month == 0:
            year, month = year - 1, 12
    return list(reversed(result))


def _next_month(value):
    return date(value.year + (value.month == 12), 1 if value.month == 12 else value.month + 1, 1)


class DashboardStatsView(APIView):
    """Authenticated dashboard aggregates sourced only from persisted records."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        month_starts = _month_starts()
        month_labels = [value.strftime("%b") for value in month_starts]

        def monthly_count(queryset, field="created_at"):
            return [
                queryset.filter(**{f"{field}__date__gte": start, f"{field}__date__lt": _next_month(start)}).count()
                for start in month_starts
            ]

        student_history = monthly_count(Student.objects.all())
        teacher_history = monthly_count(Teacher.objects.all())
        course_history = monthly_count(Course.objects.all())
        project_history = monthly_count(Project.objects.all())
        article_history = monthly_count(Article.objects.filter(status=Article.Status.PUBLISHED))

        success_rate_history, revenue_history = [], []
        for start in month_starts:
            end = _next_month(start)
            monthly_grade = Grade.objects.filter(date_graded__gte=start, date_graded__lt=end).aggregate(avg=Avg("value"))["avg"]
            success_rate_history.append(round(float(monthly_grade or 0), 2))
            paid = Payment.objects.filter(status=Payment.Status.COMPLETED).filter(
                Q(paid_at__date__gte=start, paid_at__date__lt=end)
                | Q(paid_at__isnull=True, created_at__date__gte=start, created_at__date__lt=end)
            ).aggregate(total=Sum("amount"))["total"] or 0
            revenue_history.append(float(paid))

        current_start = today.replace(day=1)
        current_revenue = Payment.objects.filter(status=Payment.Status.COMPLETED).filter(
            Q(paid_at__date__gte=current_start, paid_at__date__lte=today)
            | Q(paid_at__isnull=True, created_at__date__gte=current_start, created_at__date__lte=today)
        ).aggregate(total=Sum("amount"))["total"] or 0

        attendance_labels, attendance_history = [], []
        for days_ago in range(6, -1, -1):
            day = today - timedelta(days=days_ago)
            daily = Attendance.objects.filter(attendance_date=day).aggregate(
                total=Count("id"), present=Count("id", filter=Q(present=True))
            )
            attendance_labels.append(day.strftime("%a"))
            attendance_history.append(round((daily["present"] / daily["total"] * 100), 2) if daily["total"] else 0)

        promotion_rows = (
            Student.objects.filter(status=Student.Status.ACTIVE, school_class__isnull=False)
            .values("school_class__name")
            .annotate(total=Count("id"))
            .order_by("school_class__name")
        )
        promotion_distribution = {
            "labels": [row["school_class__name"] for row in promotion_rows],
            "data": [row["total"] for row in promotion_rows],
        }

        average_grade = Grade.objects.aggregate(avg=Avg("value"))["avg"]
        return Response({
            "students_count": Student.objects.count(),
            "teachers_count": Teacher.objects.count(),
            "courses_count": Course.objects.count(),
            "attendance_records": Attendance.objects.count(),
            "projects_count": Project.objects.count(),
            "articles_count": Article.objects.filter(status=Article.Status.PUBLISHED).count(),
            "revenue": float(Invoice.objects.filter(status=Invoice.Status.PAID).aggregate(total=Sum("amount_paid"))["total"] or 0),
            "revenue_month": float(current_revenue),
            "success_rate": round(float(average_grade or 0), 2),
            "diplomas_delivered": Student.objects.filter(status=Student.Status.GRADUATED).count(),
            "month_labels": month_labels,
            "student_history": student_history,
            "teacher_history": teacher_history,
            "course_history": course_history,
            "revenue_history": revenue_history,
            "success_rate_history": success_rate_history,
            "projects_history": project_history,
            "articles_history": article_history,
            "promotion_distribution": promotion_distribution,
            "attendance_history": {"labels": attendance_labels, "data": attendance_history},
        })
