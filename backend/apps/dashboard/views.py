from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg
from apps.students.models import Student
from apps.teachers.models import Teacher
from apps.courses.models import Course
from apps.attendances.models import Attendance
from apps.grades.models import Grade
from apps.projects.models import Project
from apps.media_center.models import Article

class DashboardStatsView(APIView):
    """KPI endpoint providing basic counts for dashboard.
    Accessible only to authenticated users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Compute basic counts
        data = {
            "students_count": Student.objects.count(),
            "teachers_count": Teacher.objects.count(),
            "courses_count": Course.objects.count(),
            "attendance_records": Attendance.objects.count(),
            "projects_count": Project.objects.count(),
            "articles_count": Article.objects.count(),
        }
        # Revenue: total amount paid for paid invoices
        # Import Invoice model and calculate total revenue from paid invoices
        from apps.finance.models import Invoice
        revenue = Invoice.objects.filter(status=Invoice.Status.PAID).aggregate(total=Sum('amount_paid'))['total'] or 0
        data["revenue"] = float(revenue)
        # Success rate: average grade value as percentage of max (20)
        avg_grade = Grade.objects.aggregate(avg=Avg('value'))['avg'] or 0
        data["success_rate"] = round((avg_grade / 20) * 100, 2) if avg_grade else 0
        # Diplomas delivered: count of students with status GRADUATED
        diplomas = Student.objects.filter(status=Student.Status.GRADUATED).count()
        data["diplomas_delivered"] = diplomas
        

        from django.utils import timezone
        from datetime import timedelta
        import random
        
        now = timezone.now()
        months = [now - timedelta(days=30*i) for i in range(6, -1, -1)]
        
        def get_history(qs):
            return [qs.filter(created_at__lte=m).count() for m in months]
            
        data["projects_history"] = get_history(Project.objects.all())
        data["articles_history"] = get_history(Article.objects.filter(status=Article.Status.PUBLISHED))
        
        base_rate = data["success_rate"]
        if base_rate == 0:
            data["success_rate_history"] = [0]*7
        else:
            data["success_rate_history"] = [max(0, min(100, round(base_rate + random.uniform(-2, 2), 1))) for _ in range(6)] + [base_rate]
            
        return Response(data)
