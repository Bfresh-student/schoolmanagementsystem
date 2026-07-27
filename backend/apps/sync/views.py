from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ConflictResolution, SyncLog, SyncOperation, SyncQueue
from .permissions import IsAdminOnly, IsAuthenticatedSyncClient
from .serializers import (
    ConflictResolutionSerializer,
    ConflictResolveInputSerializer,
    SyncBatchInputSerializer,
    SyncLogSerializer,
    SyncQueueSerializer,
)
from .services import SyncError, SyncProcessor


class SyncBatchView(APIView):
    """Point d'entrée unique appelé par le client offline-first à la
    reconnexion, avec toutes les opérations accumulées dans sa queue locale."""

    permission_classes = [IsAuthenticatedSyncClient]

    def post(self, request):
        serializer = SyncBatchInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        results = SyncProcessor.process_batch(
            entries=data["entries"],
            user=request.user,
            queue_name=data.get("queue_name", "default"),
        )
        return Response({"results": results}, status=200)


class SyncQueueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SyncQueue.objects.all()
    serializer_class = SyncQueueSerializer
    permission_classes = [IsAdminOnly]


class ConflictResolutionViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste des conflits pour supervision admin, avec action `resolve`."""

    serializer_class = ConflictResolutionSerializer
    permission_classes = [IsAdminOnly]

    def get_queryset(self):
        qs = ConflictResolution.objects.select_related("sync_operation").order_by("-created_at")
        status_filter = self.request.query_params.get("status")
        if status_filter == "pending":
            qs = qs.filter(resolution_choice="")
        elif status_filter == "resolved":
            qs = qs.exclude(resolution_choice="")
        return qs

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        conflict = self.get_object()
        serializer = ConflictResolveInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            SyncProcessor.resolve_conflict(
                conflict,
                choice=serializer.validated_data["choice"],
                resolved_by=request.user,
                merged_data=serializer.validated_data.get("merged_data"),
            )
        except SyncError as exc:
            return Response({"detail": str(exc)}, status=400)

        conflict.refresh_from_db()
        return Response(ConflictResolutionSerializer(conflict).data)


class SyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SyncLogSerializer
    permission_classes = [IsAdminOnly]

    def get_queryset(self):
        qs = SyncLog.objects.select_related("sync_operation").order_by("-logged_at")
        operation_id = self.request.query_params.get("sync_operation")
        if operation_id:
            qs = qs.filter(sync_operation_id=operation_id)
        return qs
