from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("queues", views.SyncQueueViewSet, basename="sync-queue")
router.register("conflicts", views.ConflictResolutionViewSet, basename="sync-conflict")
router.register("logs", views.SyncLogViewSet, basename="sync-log")

urlpatterns = [
    path("", include(router.urls)),
    path("batch/", views.SyncBatchView.as_view(), name="sync-batch"),
]
