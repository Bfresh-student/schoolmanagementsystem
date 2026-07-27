from rest_framework import serializers

from .models import ConflictResolution, LocalQueueEntry, SyncLog, SyncOperation, SyncQueue
from .registry import registry


class SyncEntrySerializer(serializers.Serializer):
    """Une opération telle qu'envoyée par le client offline (WatermelonDB)."""

    table_name = serializers.CharField(max_length=100)
    record_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    action = serializers.ChoiceField(choices=LocalQueueEntry.Action.choices)
    data = serializers.JSONField()
    local_timestamp = serializers.DateTimeField()
    client_operation_id = serializers.CharField(max_length=100)

    def validate_table_name(self, value):
        if not registry.is_registered(value):
            raise serializers.ValidationError(f"Table '{value}' non synchronisable.")
        return value

    def validate(self, attrs):
        if attrs["action"] != LocalQueueEntry.Action.CREATE and not attrs.get("record_id"):
            raise serializers.ValidationError("record_id est requis pour update/delete.")
        return attrs


class SyncBatchInputSerializer(serializers.Serializer):
    queue_name = serializers.CharField(max_length=100, required=False, default="default")
    entries = SyncEntrySerializer(many=True)


class SyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncLog
        fields = ["id", "sync_operation", "status", "error_message", "retry_count", "logged_at"]


class SyncOperationSerializer(serializers.ModelSerializer):
    logs = SyncLogSerializer(many=True, read_only=True)

    class Meta:
        model = SyncOperation
        fields = [
            "id", "queue", "initiated_by", "operation_type", "table_name",
            "record_id", "conflict_status", "created_at", "logs",
        ]


class ConflictResolutionSerializer(serializers.ModelSerializer):
    table_name = serializers.CharField(source="sync_operation.table_name", read_only=True)

    class Meta:
        model = ConflictResolution
        fields = [
            "id", "sync_operation", "table_name", "conflict_type", "local_version",
            "remote_version", "resolution_choice", "merged_data", "resolved_by",
            "resolved_at", "created_at",
        ]
        read_only_fields = [f for f in fields if f not in ()]


class ConflictResolveInputSerializer(serializers.Serializer):
    choice = serializers.ChoiceField(choices=ConflictResolution.Resolution.choices)
    merged_data = serializers.JSONField(required=False)

    def validate(self, attrs):
        if attrs["choice"] == ConflictResolution.Resolution.MANUAL_MERGE and not attrs.get("merged_data"):
            raise serializers.ValidationError("merged_data est requis pour une fusion manuelle.")
        return attrs


class SyncQueueSerializer(serializers.ModelSerializer):
    progress_percent = serializers.FloatField(read_only=True)

    class Meta:
        model = SyncQueue
        fields = [
            "id", "queue_name", "status", "total_operations",
            "operations_completed", "progress_percent", "last_sync",
        ]
