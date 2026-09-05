from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import Assessment, Grade, GradeConflict, GradeSyncEntry
from .permissions import GradePermission
from .serializers import (
    GradeConflictResolveSerializer,
    AssessmentSerializer,
    GradeConflictSerializer,
    GradeSerializer,
    GradeSubmitSerializer,
)


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.select_related("course", "school_class").all()
    serializer_class = AssessmentSerializer
    permission_classes = [GradePermission]

    def get_queryset(self):
        qs = super().get_queryset()
        if school_class := self.request.query_params.get("school_class"): qs = qs.filter(school_class_id=school_class)
        if academic_year := self.request.query_params.get("academic_year"): qs = qs.filter(academic_year__label=academic_year)
        return qs.filter(course__teacher__user=self.request.user) if self.request.user.role == "TEACHER" else qs
class GradeViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    GET  /grades/                -> liste (filtrée par rôle)
    GET  /grades/{id}/           -> détail
    POST /grades/submit/         -> saisie d'une note (online OU offline) ;
                                     passe TOUJOURS par le sync manager, donc
                                     détecte automatiquement les conflits.
    """
    queryset = Grade.objects.select_related("student__user", "course", "teacher").all()
    serializer_class = GradeSerializer
    permission_classes = [GradePermission]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role_name = user.role
        if role_name == "STUDENT":
            return qs.filter(student__user=user)
        if role_name == "TEACHER":
            return qs.filter(course__teacher__user=user)
        return qs

    @action(detail=False, methods=["post"])
    def submit(self, request):
        serializer = GradeSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role_name = request.user.role
        teacher_profile = getattr(request.user, "teacher_profile", None)

        # Un teacher ne peut noter que sur SES cours (l'admin peut passer outre).
        if role_name == "TEACHER" and data["course"].teacher_id != getattr(teacher_profile, "id", None):
            return Response(
                {"detail": "Vous ne pouvez saisir des notes que sur vos propres cours."},
                status=status.HTTP_403_FORBIDDEN,
            )

        entry, result = services.submit_grade(
            student=data["student"],
            course=data["assessment"].course if data.get("assessment") else data["course"],
            teacher=teacher_profile,
            value=data["value"],
            source=GradeSyncEntry.Source.LOCAL if request.data.get("offline") else GradeSyncEntry.Source.REMOTE,
            submitted_by=request.user,
            local_timestamp=data["local_timestamp"],
            local_uuid=data.get("local_uuid"),
            assessment=data.get("assessment"),
        )

        return Response(
            {
                "entry_id": entry.id,
                "local_uuid": str(entry.local_uuid),
                **result,
            },
            status=status.HTTP_202_ACCEPTED if result["outcome"] == "conflict" else status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="sync_batch")
    def sync_batch(self, request):
        """
        Rejoue un lot d'entrées créées offline (ex: un prof qui se reconnecte
        après plusieurs jours). Chaque item est traité dans l'ordre de son
        `local_timestamp`, cf. Phase 2/3 du document.
        """
        items = request.data.get("items", [])
        if not isinstance(items, list):
            return Response({"detail": "items doit être une liste."}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        role_name = request.user.role
        teacher_profile = getattr(request.user, "teacher_profile", None)
        for item in items:
            serializer = GradeSubmitSerializer(data=item)
            if not serializer.is_valid():
                results.append({"local_uuid": item.get("local_uuid"), "errors": serializer.errors})
                continue
            data = serializer.validated_data
            if role_name == "TEACHER" and data["course"].teacher_id != getattr(teacher_profile, "id", None):
                results.append({"local_uuid": str(data.get("local_uuid", "")), "errors": {"course": ["Cours non autorisé."]}})
                continue
            entry, result = services.submit_grade(
                student=data["student"],
                course=data["assessment"].course if data.get("assessment") else data["course"],
                teacher=teacher_profile,
                value=data["value"],
                source=GradeSyncEntry.Source.LOCAL,
                submitted_by=request.user,
                local_timestamp=data["local_timestamp"],
                local_uuid=data.get("local_uuid"),
                assessment=data.get("assessment"),
            )
            results.append({"entry_id": entry.id, "local_uuid": str(entry.local_uuid), **result})
        return Response({"results": results}, status=status.HTTP_200_OK)


class GradeConflictViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Réservé aux admins (cf. GradePermission).

    GET  /grade-conflicts/               -> liste des conflits (filtrable ?resolved=false)
    GET  /grade-conflicts/{id}/          -> détail d'un conflit
    POST /grade-conflicts/{id}/resolve/  -> tranche le conflit (local/remote/manual_merge)
    """
    queryset = GradeConflict.objects.select_related("grade", "sync_entry").all()
    serializer_class = GradeConflictSerializer
    permission_classes = [GradePermission]

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
        serializer = GradeConflictResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            grade = conflict.resolve(
                choice=serializer.validated_data["choice"],
                actor=request.user,
                manual_value=serializer.validated_data.get("manual_value"),
            )
        except DjangoValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GradeSerializer(grade).data)
