from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.notifications.views import (
    NotificationChannelViewSet,
    NotificationPreferenceViewSet,
    NotificationTemplateViewSet,
    NotificationTriggerViewSet,
    NotificationViewSet,
)

router = DefaultRouter()
router.register("notifications", NotificationViewSet, basename="notification")
router.register(
    "notification-preferences",
    NotificationPreferenceViewSet,
    basename="notification-preference",
)
router.register(
    "notification-channels", NotificationChannelViewSet, basename="notification-channel"
)
router.register(
    "notification-triggers", NotificationTriggerViewSet, basename="notification-trigger"
)
router.register(
    "notification-templates", NotificationTemplateViewSet, basename="notification-template"
)

app_name = "notifications"

urlpatterns = [
    path("", include(router.urls)),
]
