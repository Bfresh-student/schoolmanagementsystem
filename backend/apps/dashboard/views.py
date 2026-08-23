from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg
from apps.students.models import Student
from apps.teachers.models import Teacher
from apps.courses.models import Course
from apps.attendances.models import Attendance
from apps.grades.models import Grade

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
        

        return Response(data)
