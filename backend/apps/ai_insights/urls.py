from rest_framework.routers import DefaultRouter
from .views import InsightRequestViewSet

router = DefaultRouter()
router.register(r"requests", InsightRequestViewSet, basename="insight-request")

urlpatterns = router.urls
