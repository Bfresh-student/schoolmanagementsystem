from rest_framework import serializers
from .models import MediaAsset


class MediaAssetSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source="uploaded_by.get_full_name")

    class Meta:
        model = MediaAsset
        fields = [
            "id",
            "title",
            "description",
            "file",
            "media_type",
            "uploaded_by",
            "uploaded_by_name",
            "file_size",
            "synced",
            "updated_at",
            "created_at",
        ]
        read_only_fields = ["id", "file_size", "synced", "created_at", "updated_at"]

    def create(self, validated_data):
        file_obj = validated_data.get("file")
        if file_obj and hasattr(file_obj, "size"):
            validated_data["file_size"] = file_obj.size
        return super().create(validated_data)
