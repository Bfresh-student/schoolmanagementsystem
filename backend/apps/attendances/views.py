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

    @action(detail=False, methods=["post"])
    def submit_batch(self, request):
        serializer = AttendanceBatchSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        teacher_profile = getattr(request.user, "teacher_profile", None)
        from apps.courses.models import Course
        course = Course.objects.filter(id=data["course"]).first()
        if course is None:
            return Response({"detail": "Cours introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if course.teacher_id != getattr(teacher_profile, "id", None):
            return Response(
                {"detail": "Vous ne pouvez faire l'appel que sur vos propres cours."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from apps.students.models import Student
        items = []
        for item in data["items"]:
            if not Student.objects.filter(id=item["student"]).exists():
                return Response(
                    {"detail": f"Étudiant {item['student']} introuvable."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            items.append(item)

        source = AttendanceSyncEntry.Source.LOCAL if data["offline"] else AttendanceSyncEntry.Source.REMOTE
        summary = services.submit_attendance_batch(
            items=items,
            course=course,
            teacher=teacher_profile,
            attendance_date=data["attendance_date"],
            source=source,
            submitted_by=request.user,
        )
        return Response(summary, status=status.HTTP_200_OK)


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
