from rest_framework.routers import DefaultRouter

from .views import GradeConflictViewSet, GradeViewSet

router = DefaultRouter()
router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"grade-conflicts", GradeConflictViewSet, basename="grade-conflict")

urlpatterns = router.urls
