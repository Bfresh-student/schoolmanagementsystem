from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.enrollments.models import Inscription, InscriptionStatus
from apps.enrollments.permissions import InscriptionPermission
from apps.enrollments.serializers import (
    InscriptionCreateSerializer,
    InscriptionRejectSerializer,
    InscriptionSerializer,
    InscriptionTransitionSerializer,
)


class InscriptionViewSet(viewsets.ModelViewSet):
    """
    Endpoints :
      GET    /inscriptions/                 -> liste (filtrée par rôle)
      POST   /inscriptions/                 -> créer (online ou offline)
      GET    /inscriptions/{id}/            -> détail
      POST   /inscriptions/{id}/approve/    -> pending -> approved
      POST   /inscriptions/{id}/reject/     -> pending|approved -> rejected
      POST   /inscriptions/{id}/transition/ -> transition générique (activate, suspend, validate)
      POST   /inscriptions/sync_batch/      -> traite un lot d'inscriptions saisies offline
    """
    queryset = Inscription.objects.select_related(
        "student__user", "course", "approved_by"
    ).all()
    permission_classes = [InscriptionPermission]

    def get_serializer_class(self):
        if self.action == "create":
            return InscriptionCreateSerializer
        if self.action == "reject":
            return InscriptionRejectSerializer
        if self.action == "transition":
            return InscriptionTransitionSerializer
        return InscriptionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role_name = getattr(getattr(user, "role", None), "name", None)

        if role_name == "student":
            return qs.filter(student__user=user)
        if role_name == "teacher":
            return qs.filter(course__teacher__user=user)
        return qs  # admin : tout voir

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inscription = serializer.save(synced=not serializer.validated_data.get("created_offline", False))
        out = InscriptionSerializer(inscription)
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        inscription = self.get_object()
        try:
            inscription.transition_to(InscriptionStatus.APPROVED, actor=request.user)
        except DjangoValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InscriptionSerializer(inscription).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        inscription = self.get_object()
        serializer = InscriptionRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            inscription.transition_to(
                InscriptionStatus.REJECTED,
                actor=request.user,
                reason=serializer.validated_data["reason"],
            )
        except DjangoValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InscriptionSerializer(inscription).data)

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        """Transition générique : approved->active, active->suspended, ->validated, etc."""
        inscription = self.get_object()
        serializer = InscriptionTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            inscription.transition_to(serializer.validated_data["status"], actor=request.user)
        except DjangoValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InscriptionSerializer(inscription).data)

    @action(detail=False, methods=["post"])
    def sync_batch(self, request):
        """
        Reçoit un lot d'inscriptions saisies offline par un admin (scénario
        Cas 1 / Cas 2 du document, variante "inscription approuvée offline").

        Payload attendu :
        {
          "items": [
            {"local_uuid": "...", "student": 1, "course": 3,
             "requested_at": "...", "created_offline": true},
            ...
          ]
        }

        Pour chaque item : create-if-not-exists (idempotent via local_uuid),
        pas de détection de conflit ici car il s'agit de créations (pas de
        mise à jour concurrente) — contrairement à GRADES/ATTENDANCES.
        """
        items = request.data.get("items", [])
        results = []
        for item in items:
            serializer = InscriptionCreateSerializer(data=item)
            if not serializer.is_valid():
                results.append({
                    "local_uuid": item.get("local_uuid"),
                    "status": "error",
                    "errors": serializer.errors,
                })
                continue
            inscription = serializer.save(synced=True)
            results.append({
                "local_uuid": str(inscription.local_uuid),
                "id": inscription.id,
                "status": "synced",
            })
        return Response({"results": results}, status=status.HTTP_200_OK)
