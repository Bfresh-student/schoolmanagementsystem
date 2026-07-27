from rest_framework.routers import DefaultRouter
from .views import MediaAssetViewSet

router = DefaultRouter()
router.register(r"assets", MediaAssetViewSet, basename="media-asset")

urlpatterns = router.urls
