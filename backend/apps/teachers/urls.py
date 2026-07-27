from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import TeacherViewSet
router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teacher')
app_name = "teachers"

urlpatterns = [
    path("", include(router.urls)),
]