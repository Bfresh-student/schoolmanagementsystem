from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import Attendance, AttendanceConflict, AttendanceSyncEntry
from .permissions import AttendanceConflictPermission, AttendancePermission
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

    @action(detail=False, methods=["post"], url_path="submit_batch")
    def submit_batch(self, request):
        """Submit a full class attendance batch."""
        from django.shortcuts import get_object_or_404
        from apps.courses.models import Course

        serializer = AttendanceBatchSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        course_id = data["course"]
        course = get_object_or_404(Course, id=course_id)

        role_name = getattr(request.user, "role", None)
        if role_name not in ("TEACHER", "ADMIN"):
            return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

        teacher = getattr(request.user, "teacher_profile", None)

        if role_name == "TEACHER":
            # Un enseignant ne peut saisir que sur SES PROPRES cours.
            if not teacher or course.teacher_id != teacher.id:
                return Response(
                    {"detail": "Vous n'êtes pas autorisé à saisir la présence pour ce cours."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif not teacher:
            # Admin sans profil enseignant : on rattache l'appel au prof titulaire du cours.
            teacher = course.teacher

        source = "offline_sync" if data.get("offline") else "web_ui"
        
        summary = services.submit_attendance_batch(
            items=data["items"],
            course=course,
            teacher=teacher,
            attendance_date=data["attendance_date"],
            source=source,
            submitted_by=request.user,
        )
        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """Return attendance statistics per student for the current user (teacher).
        For teachers: stats across their courses.
        For admins: stats across all.
        Accepts optional ?school_class=<id> and ?course_id=<uuid> filters.
        """
        from django.db.models import Count

        qs = self.get_queryset()
        role = getattr(request.user, "role", None)
        if role == "TEACHER":
            try:
                teacher_profile = request.user.teacher_profile
                qs = qs.filter(course__teacher_id=teacher_profile.id)
            except Exception:
                qs = qs.none()

        # Optional filters
        school_class_id = request.query_params.get("school_class")
        course_id = request.query_params.get("course_id")
        if school_class_id:
            qs = qs.filter(student__school_class_id=school_class_id)
        if course_id:
            qs = qs.filter(course_id=course_id)

        # Two separate annotated queries merged in Python
        # (avoids SQLite limitations with conditional aggregates)
        totals = {
            r["student_id"]: r["total"]
            for r in qs.values("student_id").annotate(total=Count("id"))
        }
        presents = {
            r["student_id"]: r["cnt"]
            for r in qs.filter(present=True).values("student_id").annotate(cnt=Count("id"))
        }
        absents = {
            r["student_id"]: r["cnt"]
            for r in qs.filter(present=False).values("student_id").annotate(cnt=Count("id"))
        }

        result = [
            {
                "student_id": sid,
                "total": totals[sid],
                "present": presents.get(sid, 0),
                "absent": absents.get(sid, 0),
            }
            for sid in totals
        ]
        return Response(result)


class AttendanceConflictViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Réservé aux admins. GET liste/détail + POST /{id}/resolve/."""
    queryset = AttendanceConflict.objects.select_related("attendance", "sync_entry").all()
    serializer_class = AttendanceConflictSerializer
    permission_classes = [AttendanceConflictPermission]

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