from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.notifications.models import (
    Notification,
    NotificationChannel,
    NotificationPreference,
    NotificationTemplate,
    NotificationTrigger,
)
from apps.notifications.permissions import HasResourcePermission, IsOwnNotification
from apps.notifications.serializers import (
    NotificationChannelSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
    NotificationTemplateSerializer,
    NotificationTriggerSerializer,
)


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Boîte de notifications de l'utilisateur connecté.
    Lecture seule : les notifications sont créées uniquement via
    enqueue_notification() côté serveur, jamais directement par l'API.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsOwnNotification]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).prefetch_related(
            "queue_entries"
        )

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": count})

    @action(detail=True, methods=["patch"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_read()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        from django.utils import timezone

        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({"marked_read": updated})


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)


class NotificationChannelViewSet(viewsets.ModelViewSet):
    """Administration des canaux (admin uniquement, via RBAC)."""

    queryset = NotificationChannel.objects.all()
    serializer_class = NotificationChannelSerializer
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "notification_channels"


class NotificationTriggerViewSet(viewsets.ModelViewSet):
    queryset = NotificationTrigger.objects.all()
    serializer_class = NotificationTriggerSerializer
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "notification_triggers"


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.select_related("channel")
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "notification_templates"

    @action(detail=True, methods=["post"], url_path="preview")
    def preview(self, request, pk=None):
        template = self.get_object()
        context = request.data.get("context", {})
        subject, content = template.render(context)
        return Response({"subject": subject, "content": content})
