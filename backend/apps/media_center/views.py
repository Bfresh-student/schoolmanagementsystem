import logging

from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from .models import MediaAsset, Tag, Article
from .serializers import MediaAssetSerializer, TagSerializer, ArticleSerializer
from .tasks import process_media_upload_task

logger = logging.getLogger(__name__)


def _enqueue_processing(asset_id):
    """Enqueue the post-processing task without letting a broker outage
    (e.g. Redis not configured/reachable) turn a successful upload into
    a 500 response to the client."""
    try:
        process_media_upload_task.delay(asset_id)
    except Exception:
        logger.exception(
            "Could not enqueue process_media_upload_task for asset %s "
            "(is CELERY_BROKER_URL set and reachable?)", asset_id
        )


class MediaAssetViewSet(viewsets.ModelViewSet):
    """CRUD API for Media Asset management."""
    queryset = MediaAsset.objects.all().order_by('-created_at')
    serializer_class = MediaAssetSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        uploaded_by = self.request.user if self.request.user.is_authenticated else None
        asset = serializer.save(uploaded_by=uploaded_by)
        _enqueue_processing(asset.id)

    @action(detail=True, methods=['post'], url_path='reprocess')
    def reprocess(self, request, pk=None):
        """Trigger reprocessing of an existing media asset."""
        asset = self.get_object()
        try:
            task = process_media_upload_task.delay(asset.id)
        except Exception:
            logger.exception("Could not enqueue reprocessing for asset %s", asset.id)
            return Response(
                {"message": "Reprocessing could not be queued (task broker unavailable)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"message": f"Reprocessing enqueued for asset {asset.id}", "task_id": task.id},
            status=status.HTTP_202_ACCEPTED
        )


class TagViewSet(viewsets.ModelViewSet):
    """CRUD API for Tag management."""
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD API for Article management."""
    queryset = Article.objects.all().order_by('-publication_date', '-created_at')
    serializer_class = ArticleSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['status', 'category', 'author']
    search_fields = ['title', 'description', 'content']
    ordering = ['-publication_date']

    def _handle_cover_image(self, request):
        cover_file = request.FILES.get('cover_image')
        if cover_file:
            # Create a MediaAsset from the uploaded file
            uploaded_by = request.user if request.user.is_authenticated else None
            asset = MediaAsset.objects.create(
                title=f"Cover for {request.data.get('title', 'Article')}",
                file=cover_file,
                media_type="image",
                uploaded_by=uploaded_by
            )
            return asset
        # Also support passing an existing cover_image ID
        cover_id = request.data.get('cover_image_id')
        if cover_id:
            try:
                return MediaAsset.objects.get(id=cover_id)
            except MediaAsset.DoesNotExist:
                pass
        return None

    def _handle_tags(self, article, request):
        import json
        from django.utils.text import slugify
        tags_list = request.data.get('tags_list')
        if tags_list:
            try:
                tag_names = json.loads(tags_list)
                if isinstance(tag_names, list):
                    tag_objs = []
                    for name in tag_names:
                        slug = slugify(name)
                        if slug:
                            tag, _ = Tag.objects.get_or_create(slug=slug, defaults={'name': name})
                            tag_objs.append(tag)
                    article.tags.set(tag_objs)
            except Exception:
                pass

    def perform_create(self, serializer):
        author = self.request.user if self.request.user.is_authenticated else None
        asset = self._handle_cover_image(self.request)
        if asset:
            article = serializer.save(author=author, cover_image=asset)
        else:
            article = serializer.save(author=author)
        self._handle_tags(article, self.request)

    def perform_update(self, serializer):
        asset = self._handle_cover_image(self.request)
        if asset:
            article = serializer.save(cover_image=asset)
        else:
            article = serializer.save()
        self._handle_tags(article, self.request)
