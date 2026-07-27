from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import Grade, GradeConflict, GradeSyncEntry
from .permissions import GradePermission
from .serializers import (
    GradeConflictResolveSerializer,
    GradeConflictSerializer,
    GradeSerializer,
    GradeSubmitSerializer,
)


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
        role_name = getattr(getattr(user, "role", None), "name", None)
        if role_name == "student":
            return qs.filter(student__user=user)
        if role_name == "teacher":
            return qs.filter(course__teacher__user=user)
        return qs

    @action(detail=False, methods=["post"])
    def submit(self, request):
        serializer = GradeSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role_name = getattr(getattr(request.user, "role", None), "name", None)
        teacher_profile = getattr(request.user, "teacher_profile", None)

        # Un teacher ne peut noter que sur SES cours (l'admin peut passer outre).
        if role_name == "teacher" and data["course"].teacher_id != getattr(teacher_profile, "id", None):
            return Response(
                {"detail": "Vous ne pouvez saisir des notes que sur vos propres cours."},
                status=status.HTTP_403_FORBIDDEN,
            )

        entry, result = services.submit_grade(
            student=data["student"],
            course=data["course"],
            teacher=teacher_profile,
            value=data["value"],
            source=GradeSyncEntry.Source.LOCAL if request.data.get("offline") else GradeSyncEntry.Source.REMOTE,
            submitted_by=request.user,
            local_timestamp=data["local_timestamp"],
            local_uuid=data.get("local_uuid"),
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
        # On crée d'abord toutes les entries en PENDING, puis on les traite
        # en lot dans l'ordre chronologique de leur local_timestamp (garantit
        # l'ordre des opérations même si le payload arrive dans le désordre).
        items = request.data.get("items", [])
        created_entries = []
        from .serializers import GradeSyncEntrySerializer

        for item in items:
            s = GradeSyncEntrySerializer(data=item)
            if not s.is_valid():
                created_entries.append({"local_uuid": item.get("local_uuid"), "errors": s.errors})
                continue
            if GradeSyncEntry.objects.filter(local_uuid=s.validated_data.get("local_uuid")).exists():
                continue
            created_entries.append(s.save(status="pending"))

        pending_qs = GradeSyncEntry.objects.filter(
            id__in=[e.id for e in created_entries if hasattr(e, "id")]
        )
        results = services.process_pending_queue(pending_qs)
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
