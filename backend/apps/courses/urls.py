from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CourseViewSet

router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")

app_name = "courses"

urlpatterns = [
    path("", include(router.urls)),
]
