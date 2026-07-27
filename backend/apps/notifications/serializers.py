from rest_framework import serializers

from apps.notifications.models import (
    Notification,
    NotificationChannel,
    NotificationPreference,
    NotificationQueueEntry,
    NotificationTemplate,
    NotificationTrigger,
)


class NotificationChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationChannel
        fields = ["id", "name", "is_active"]


class NotificationTriggerSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTrigger
        fields = ["id", "trigger_name", "template_key", "default_priority"]


class NotificationTemplateSerializer(serializers.ModelSerializer):
    channel_name = serializers.CharField(source="channel.name", read_only=True)

    class Meta:
        model = NotificationTemplate
        fields = [
            "id",
            "template_key",
            "channel",
            "channel_name",
            "subject_line",
            "content_template",
            "variables",
        ]


class NotificationQueueEntrySerializer(serializers.ModelSerializer):
    channel_name = serializers.CharField(source="channel.name", read_only=True)

    class Meta:
        model = NotificationQueueEntry
        fields = [
            "id",
            "channel",
            "channel_name",
            "status",
            "recipient_address",
            "error_message",
            "retry_count",
            "synced",
            "created_at",
        ]
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    """Vue destinée au destinataire final (dashboard étudiant/prof/admin)."""

    queue_entries = NotificationQueueEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "trigger_type",
            "title",
            "content",
            "priority",
            "is_read",
            "read_at",
            "created_at",
            "queue_entries",
        ]
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "id",
            "trigger_type",
            "email_enabled",
            "sms_enabled",
            "push_enabled",
            "quiet_hours_start",
            "quiet_hours_end",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
