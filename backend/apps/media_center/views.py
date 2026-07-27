from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MediaAsset
from .serializers import MediaAssetSerializer
from .tasks import process_media_upload_task


class MediaAssetViewSet(viewsets.ModelViewSet):
    """CRUD API for Media Asset management."""
    queryset = MediaAsset.objects.all().order_by('-created_at')
    serializer_class = MediaAssetSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def perform_create(self, serializer):
        uploaded_by = self.request.user if self.request.user.is_authenticated else None
        asset = serializer.save(uploaded_by=uploaded_by)
        process_media_upload_task.delay(asset.id)

    @action(detail=True, methods=['post'], url_path='reprocess')
    def reprocess(self, request, pk=None):
        """Trigger reprocessing of an existing media asset."""
        asset = self.get_object()
        task = process_media_upload_task.delay(asset.id)
        return Response(
            {"message": f"Reprocessing enqueued for asset {asset.id}", "task_id": task.id},
            status=status.HTTP_202_ACCEPTED
        )
