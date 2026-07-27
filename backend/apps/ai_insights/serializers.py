from rest_framework import serializers
from .models import InsightRequest


class InsightRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source="student.__str__")
    requested_by_name = serializers.ReadOnlyField(source="requested_by.get_full_name")

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
