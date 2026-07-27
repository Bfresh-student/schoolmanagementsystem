from rest_framework.routers import DefaultRouter

from .views import SpecializationViewSet, StudentViewSet

router = DefaultRouter()
router.register("students", StudentViewSet, basename="student")
router.register("specializations", SpecializationViewSet, basename="specialization")

urlpatterns = router.urls