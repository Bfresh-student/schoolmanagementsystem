from rest_framework import serializers
from .models import MediaAsset, Tag, Article, Comment


class MediaAssetSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None

    class Meta:
        model = MediaAsset
        fields = [
            "id", "title", "description", "file", "file_url",
            "media_type", "promotion", "album", "uploaded_by", "uploaded_by_name",
            "file_size", "synced", "updated_at", "created_at",
        ]
        read_only_fields = ["id", "file_size", "synced", "created_at", "updated_at"]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def create(self, validated_data):
        file_obj = validated_data.get("file")
        if file_obj and hasattr(file_obj, "size"):
            validated_data["file_size"] = file_obj.size
        return super().create(validated_data)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["id"]


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "article", "author_name", "author_email", "content", "is_approved", "created_at"]
        read_only_fields = ["id", "created_at", "is_approved"]


class ArticleSerializer(serializers.ModelSerializer):
    cover_image = MediaAssetSerializer(read_only=True)
    gallery = MediaAssetSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else None

    def get_share_url(self, obj):
        request = self.context.get("request")
        if obj.slug:
            path = "/blog/" + obj.slug
            if request:
                return request.build_absolute_uri(path)
            return "https://cejec.edu.ht" + path
        return None

    def get_recent_comments(self, obj):
        qs = obj.comments.filter(is_approved=True)[:5]
        return CommentSerializer(qs, many=True).data

    class Meta:
        model = Article
        fields = [
            "id", "title", "slug", "description", "content",
            "cover_image", "gallery", "tags", "category",
            "author", "author_name", "status", "publication_date",
            "promotion", "views_count", "shares_count", "comments_count",
            "share_url", "recent_comments", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "created_at", "updated_at", "author_name",
            "views_count", "shares_count", "comments_count",
        ]
