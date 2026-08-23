from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import Attendance, AttendanceConflict, AttendanceSyncEntry
from .permissions import AttendancePermission
from .serializers import (
    AttendanceBatchSubmitSerializer,
    AttendanceConflictResolveSerializer,
    AttendanceConflictSerializer,
    AttendanceSerializer,
)


class AttendanceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    GET  /attendances/                -> liste (filtrée par rôle)
    GET  /attendances/{id}/           -> détail
    POST /attendances/submit_batch/   -> appel complet (Cas 3 : batch de N étudiants,
                                          online ou offline)
    """
    queryset = Attendance.objects.select_related("student__user", "course", "teacher").all()
    serializer_class = AttendanceSerializer
    permission_classes = [AttendancePermission]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role_name = getattr(user, "role", None)
        if role_name == "STUDENT":
            return qs.filter(student__user=user)
        if role_name == "TEACHER":
            return qs.filter(course__teacher__user=user)
        return qs

    @action(detail=False, methods=["get"], url_path="by_course")
    def by_course(self, request):
        """Return attendances for a given course and optional date.
        Query params:
          course_id (required) - UUID of the course
          date (optional) - YYYY-MM-DD filter
        """
        course_id = request.query_params.get("course_id")
        if not course_id:
            return Response({"detail": "course_id parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        date_str = request.query_params.get("date")
        qs = self.get_queryset().filter(course_id=course_id)
        if date_str:
            qs = qs.filter(attendance_date=date_str)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """Return attendance statistics per student for the current user (teacher).
        For teachers: stats across their courses.
        For admins: stats across all.
        """
        from django.db.models import Count, Q, Sum, Case, When
        qs = self.get_queryset()
        role = getattr(request.user, "role", None)
        if role == "TEACHER":
            teacher_profile = getattr(request.user, "teacher_profile", None)
            qs = qs.filter(course__teacher_id=getattr(teacher_profile, "id", None))
        # Aggregate counts per student
        stats_qs = qs.values("student_id").annotate(
            total=Count("id"),
            present=Count(Case(When(present=True, then=1))),
            absent=Count(Case(When(present=False, then=1))),
        )
        return Response(stats_qs)


class AttendanceConflictViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Réservé aux admins. GET liste/détail + POST /{id}/resolve/."""
    queryset = AttendanceConflict.objects.select_related("attendance", "sync_entry").all()
    serializer_class = AttendanceConflictSerializer
    permission_classes = [AttendancePermission]

    def get_queryset(self):
        qs = super().get_queryset()
        resolved_param = self.request.query_params.get("resolved")
        if resolved_param == "false":
            qs = qs.filter(resolution_choice__isnull=True)
        elif resolved_param == "true":
            qs = qs.filter(resolution_choice__isnull=False)
        return qs

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        conflict = self.get_object()
        serializer = AttendanceConflictResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            attendance = conflict.resolve(
                choice=serializer.validated_data["choice"],
                actor=request.user,
                manual_present=serializer.validated_data.get("manual_present"),
            )
        except DjangoValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AttendanceSerializer(attendance).data)
