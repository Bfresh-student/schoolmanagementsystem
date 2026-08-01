from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import TeacherViewSet

router = DefaultRouter()
# Register with an empty prefix to avoid duplicate 'teachers' segment in URLs.
router.register(r'', TeacherViewSet, basename='teacher')

app_name = "teachers"

urlpatterns = [
    path("", include(router.urls)),
]