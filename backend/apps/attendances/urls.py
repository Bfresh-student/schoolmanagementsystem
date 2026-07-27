from rest_framework.routers import DefaultRouter

from .views import AttendanceConflictViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r"attendances", AttendanceViewSet, basename="attendance")
router.register(r"attendance-conflicts", AttendanceConflictViewSet, basename="attendance-conflict")

urlpatterns = router.urls
