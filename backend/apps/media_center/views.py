import logging

from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from django.db import models, transaction

from .models import MediaAsset, Tag, Article, Comment
from .serializers import MediaAssetSerializer, TagSerializer, ArticleSerializer, CommentSerializer
from .tasks import process_media_upload_task

logger = logging.getLogger(__name__)


def _enqueue_processing(asset_id):
    try:
        process_media_upload_task.delay(asset_id)
    except Exception:
        logger.exception(
            "Could not enqueue process_media_upload_task for asset %s "
            "(is CELERY_BROKER_URL set and reachable?)", asset_id
        )


class MediaAssetViewSet(viewsets.ModelViewSet):
    queryset = MediaAsset.objects.all().order_by("-created_at")
    serializer_class = MediaAssetSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        uploaded_by = self.request.user if self.request.user.is_authenticated else None
        asset = serializer.save(uploaded_by=uploaded_by)
        _enqueue_processing(asset.id)

    @action(detail=True, methods=["post"], url_path="reprocess")
    def reprocess(self, request, pk=None):
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
            status=status.HTTP_202_ACCEPTED,
        )


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by("-publication_date", "-created_at")
    serializer_class = ArticleSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ["status", "category", "author"]
    search_fields = ["title", "description", "content"]
    ordering = ["-publication_date"]

    def _handle_cover_image(self, request):
        cover_file = request.FILES.get("cover_image")
        if cover_file:
            uploaded_by = request.user if request.user.is_authenticated else None
            asset = MediaAsset.objects.create(
                title=f"Cover for {request.data.get('title', 'Article')}",
                file=cover_file,
                media_type="image",
                uploaded_by=uploaded_by,
                file_size=cover_file.size,
            )
            return asset
        cover_id = request.data.get("cover_image_id")
        if cover_id:
            try:
                return MediaAsset.objects.get(id=cover_id)
            except MediaAsset.DoesNotExist:
                pass
        return None

    def _handle_gallery_files(self, request, article):
        """Persist all gallery uploads and relate them to their article."""
        uploaded_by = request.user if request.user.is_authenticated else None
        for uploaded_file in request.FILES.getlist("gallery_files"):
            media_type = "video" if uploaded_file.content_type.startswith("video/") else "image"
            asset = MediaAsset.objects.create(
                title=uploaded_file.name,
                file=uploaded_file,
                media_type=media_type,
                uploaded_by=uploaded_by,
                file_size=uploaded_file.size,
            )
            article.gallery.add(asset)

    def _handle_tags(self, article, request):
        import json
        from django.utils.text import slugify
        tags_list = request.data.get("tags_list")
        if tags_list:
            try:
                tag_names = json.loads(tags_list)
                if isinstance(tag_names, list):
                    tag_objs = []
                    for name in tag_names:
                        s = slugify(name)
                        if s:
                            tag, _ = Tag.objects.get_or_create(slug=s, defaults={"name": name})
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
        self._handle_gallery_files(self.request, article)

    def perform_update(self, serializer):
        asset = self._handle_cover_image(self.request)
        if asset:
            article = serializer.save(cover_image=asset)
        else:
            article = serializer.save()
        self._handle_tags(article, self.request)
        self._handle_gallery_files(self.request, article)

    # ------------------------------------------------------------------ #
    # Engagement actions                                                   #
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=["post"], url_path="increment_view",
            permission_classes=[AllowAny], authentication_classes=[])
    def increment_view(self, request, pk=None):
        """Atomically increment view counter."""
        with transaction.atomic():
            Article.objects.filter(pk=pk).update(views_count=models.F("views_count") + 1)
        article = self.get_object()
        return Response({"views_count": article.views_count})

    @action(detail=True, methods=["post"], url_path="increment_share",
            permission_classes=[AllowAny], authentication_classes=[])
    def increment_share(self, request, pk=None):
        """Atomically increment share counter."""
        with transaction.atomic():
            Article.objects.filter(pk=pk).update(shares_count=models.F("shares_count") + 1)
        article = self.get_object()
        return Response({"shares_count": article.shares_count})

    @action(detail=True, methods=["get", "post"], url_path="comments",
            permission_classes=[AllowAny], authentication_classes=[])
    def comments(self, request, pk=None):
        article = self.get_object()
        if request.method == "GET":
            qs = article.comments.filter(is_approved=True)
            serializer = CommentSerializer(qs, many=True)
            return Response(serializer.data)
        # POST – add a new comment
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        data["article"] = article.pk
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                Article.objects.filter(pk=article.pk).update(
                    comments_count=models.F("comments_count") + 1
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
