from rest_framework import serializers
from .models import MediaAsset, Tag, Article


class MediaAssetSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source="uploaded_by.get_full_name")
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = [
            "id",
            "title",
            "description",
            "file",
            "file_url",
            "media_type",
            "uploaded_by",
            "uploaded_by_name",
            "file_size",
            "synced",
            "updated_at",
            "created_at",
        ]
        read_only_fields = ["id", "file_size", "synced", "created_at", "updated_at"]

    def get_file_url(self, obj):
        """Return the absolute URL for the file so cross-origin clients can load it."""
        if not obj.file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        # Fallback: return relative URL (e.g. /media/media_center/...)
        return obj.file.url

    def create(self, validated_data):
        file_obj = validated_data.get("file")
        if file_obj and hasattr(file_obj, "size"):
            validated_data["file_size"] = file_obj.size
        return super().create(validated_data)
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id']

class ArticleSerializer(serializers.ModelSerializer):
    cover_image = MediaAssetSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author_name = serializers.ReadOnlyField(source='author.get_full_name')

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'description', 'content', 'cover_image', 'tags',
            'category', 'author', 'author_name', 'status', 'publication_date',
            'promotion', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author_name']
