from rest_framework import serializers
from .models import MediaAsset, Tag, Article


class MediaAssetSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None

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
    author_name = serializers.SerializerMethodField()

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else None

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'description', 'content', 'cover_image', 'tags',
            'category', 'author', 'author_name', 'status', 'publication_date',
            'promotion', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author_name']