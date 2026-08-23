from django.db import models
from django.conf import settings


class MediaType(models.TextChoices):
    IMAGE = "image", "Image"
    DOCUMENT = "document", "Document"
    VIDEO = "video", "Video"
    OTHER = "other", "Other"


class MediaAsset(models.Model):
    """Media center asset upload for documents, images, and videos."""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="media_center/")
    media_type = models.CharField(
        max_length=20,
        choices=MediaType.choices,
        default=MediaType.OTHER,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_media_assets",
    )
    file_size = models.BigIntegerField(default=0, help_text="File size in bytes")
    synced = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Media Asset"
        verbose_name_plural = "Media Assets"

    def __str__(self):
        return f"{self.title} ({self.media_type})"

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Tag"
        verbose_name_plural = "Tags"

    def __str__(self):
        return self.name

class Article(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        PUBLISHED = "published", "Publié"
        ARCHIVED = "archived", "Archivé"
        SCHEDULED = "scheduled", "Programmé"

    class Category(models.TextChoices):
        NEWS = "news", "Actualités"
        COMMUNICATION = "communication", "Communiqués"
        EVENT = "event", "Événements"
        ENTREPRENEURSHIP = "entrepreneurship", "Entrepreneuriat"
        INNOVATION = "innovation", "Innovation"
        TESTIMONIAL = "testimonial", "Témoignages"
        PARTNERSHIP = "partnership", "Partenariats"
        STUDENT_LIFE = "student_life", "Vie estudiantine"
        SUCCESS = "success", "Réussites"
        TRAINING = "training", "Formations"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content = models.TextField()
    cover_image = models.ForeignKey(MediaAsset, null=True, blank=True, on_delete=models.SET_NULL, related_name='article_covers')
    tags = models.ManyToManyField(Tag, blank=True, related_name='articles')
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.NEWS)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='articles')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    publication_date = models.DateTimeField(null=True, blank=True)
    promotion = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-publication_date', '-created_at']
        verbose_name = "Article"
        verbose_name_plural = "Articles"

    def __str__(self):
        return self.title
