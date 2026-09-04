from django.db import models
from django.conf import settings


class MediaType(models.TextChoices):
    IMAGE = "image", "Image"
    DOCUMENT = "document", "Document"
    VIDEO = "video", "Video"
    OTHER = "other", "Other"


class MediaAsset(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="media_center/")
    media_type = models.CharField(max_length=20, choices=MediaType.choices, default=MediaType.OTHER)
    promotion = models.CharField(max_length=50, blank=True)
    album = models.CharField(max_length=150, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="uploaded_media_assets")
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
        ordering = ["name"]
        verbose_name = "Tag"
        verbose_name_plural = "Tags"

    def __str__(self):
        return self.name


class Article(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        PUBLISHED = "published", "Publie"
        ARCHIVED = "archived", "Archive"
        SCHEDULED = "scheduled", "Programme"

    class Category(models.TextChoices):
        NEWS = "news", "Actualites"
        COMMUNICATION = "communication", "Communiques"
        EVENT = "event", "Evenements"
        ENTREPRENEURSHIP = "entrepreneurship", "Entrepreneuriat"
        INNOVATION = "innovation", "Innovation"
        TESTIMONIAL = "testimonial", "Temoignages"
        PARTNERSHIP = "partnership", "Partenariats"
        STUDENT_LIFE = "student_life", "Vie estudiantine"
        SUCCESS = "success", "Reussites"
        TRAINING = "training", "Formations"

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, blank=True, unique=True)
    description = models.TextField(blank=True)
    content = models.TextField()
    cover_image = models.ForeignKey(MediaAsset, null=True, blank=True, on_delete=models.SET_NULL, related_name="article_covers")
    gallery = models.ManyToManyField(MediaAsset, blank=True, related_name="article_galleries")
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.NEWS)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="articles")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    publication_date = models.DateTimeField(null=True, blank=True)
    promotion = models.CharField(max_length=50, blank=True)
    views_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-publication_date", "-created_at"]
        verbose_name = "Article"
        verbose_name_plural = "Articles"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        from django.utils.text import slugify
        import uuid
        if not self.slug:
            base_slug = slugify(self.title) or "article"
            candidate = base_slug
            qs = Article.objects.filter(slug=candidate)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                candidate = base_slug + "-" + str(uuid.uuid4())[:8]
            self.slug = candidate
        super().save(*args, **kwargs)


class Comment(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="comments")
    author_name = models.CharField(max_length=150)
    author_email = models.EmailField(blank=True)
    content = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Commentaire"
        verbose_name_plural = "Commentaires"

    def __str__(self):
        return "Comment by " + self.author_name
