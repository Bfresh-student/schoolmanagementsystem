from django.contrib import admin

from .models import MediaAsset, Tag, Article


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
    list_display = ("title", "category", "status", "author", "publication_date", "created_at")
    list_filter = ("status", "category")
    search_fields = ("title", "description", "content")
    readonly_fields = ("created_at", "updated_at")