import logging

from celery import shared_task
from django.utils import timezone

from apps.media_center.models import Article, MediaAsset

logger = logging.getLogger(__name__)


@shared_task
def process_media_upload_task(asset_id):
    """Calcule les métadonnées du fichier après son enregistrement."""
    try:
        asset = MediaAsset.objects.get(pk=asset_id)
    except MediaAsset.DoesNotExist:
        logger.error("MediaAsset %s not found for processing", asset_id)
        return
    try:
        if asset.file and hasattr(asset.file, "size"):
            asset.file_size = asset.file.size
        asset.synced = True
        asset.save(update_fields=["file_size", "synced", "updated_at"])
    except Exception:
        logger.exception("Failed processing MediaAsset %s", asset_id)


@shared_task
def cleanup_unused_media_task():
    """Point d'extension pour le nettoyage périodique des médias orphelins."""
    return 0


@shared_task
def publish_scheduled_articles():
    """Publie les articles programmés dont la date est arrivée."""
    due_articles = Article.objects.filter(
        status=Article.Status.SCHEDULED,
        publication_date__isnull=False,
        publication_date__lte=timezone.now(),
    ).select_related("author")
    published = 0
    for article in due_articles:
        article.status = Article.Status.PUBLISHED
        article.save(update_fields=["status", "updated_at"])
        published += 1
        if article.author_id:
            try:
                from apps.notifications.services import enqueue_notification
                enqueue_notification(
                    recipient_id=article.author_id,
                    trigger_type="article_published",
                    context={"article_title": article.title, "publication_date": article.publication_date.isoformat()},
                    priority="normal",
                )
            except Exception:
                # La publication ne dépend jamais de la disponibilité du canal.
                pass
    return published
