from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# Import models for statistics
from apps.students.models import Student
from apps.teachers.models import Teacher
from apps.courses.models import Course
from apps.attendances.models import Attendance

class DashboardStatsView(APIView):
    """KPI endpoint providing basic counts for dashboard.
    Accessible only to authenticated users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            "students_count": Student.objects.count(),
            "teachers_count": Teacher.objects.count(),
            "courses_count": Course.objects.count(),
            "attendance_records": Attendance.objects.count(),
        }
        return Response(data)
