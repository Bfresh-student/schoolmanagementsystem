from django.contrib import admin
from .models import MediaAsset, Tag, Article, Comment


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = ("title", "media_type", "uploaded_by", "file_size", "synced", "created_at")
    list_filter = ("media_type", "synced")
    search_fields = ("title", "description")
    readonly_fields = ("file_size", "synced", "created_at", "updated_at")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = (
        "title", "category", "status", "author",
        "views_count", "shares_count", "comments_count",
        "publication_date", "created_at",
    )
    list_filter = ("status", "category")
    search_fields = ("title", "description", "content")
    readonly_fields = (
        "slug", "views_count", "shares_count", "comments_count",
        "created_at", "updated_at",
    )
    filter_horizontal = ("tags",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("author_name", "article", "is_approved", "created_at")
    list_filter = ("is_approved",)
    search_fields = ("author_name", "content")
    actions = ["approve_comments"]

    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)
    approve_comments.short_description = "Approuver les commentaires sélectionnés"
