from rest_framework.routers import DefaultRouter
from .views import MediaAssetViewSet, TagViewSet, ArticleViewSet

router = DefaultRouter()
router.register(r"assets", MediaAssetViewSet, basename="asset")
router.register(r"media-assets", MediaAssetViewSet, basename="media-asset")
router.register(r"tags", TagViewSet, basename="tag")
router.register(r"articles", ArticleViewSet, basename="article")

urlpatterns = router.urls
