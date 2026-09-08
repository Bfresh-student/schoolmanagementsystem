from rest_framework import serializers
from .models import InsightRequest


class InsightRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()

    def get_student_name(self, obj):
        return str(obj.student) if obj.student else None

    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name() if obj.requested_by else None

    class Meta:
        model = InsightRequest
        fields = [
            "id",
            "student",
            "student_name",
            "prompt",
            "insight_type",
            "response",
            "status",
            "requested_by",
            "requested_by_name",
            "synced",
            "updated_at",
            "created_at",
        ]
        read_only_fields = ["id", "response", "status", "synced", "created_at", "updated_at"]
