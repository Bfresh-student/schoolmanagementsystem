import logging
from celery import shared_task
from .models import MediaAsset

logger = logging.getLogger(__name__)


@shared_task
def process_media_upload_task(asset_id):
    """Post-processing task for uploaded media assets (calculating size, metadata extraction)."""
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
        logger.info("MediaAsset %s processed successfully", asset_id)
    except Exception:
        logger.exception("Failed processing MediaAsset %s", asset_id)


@shared_task
def cleanup_unused_media_task():
    """Periodic task to clean up orphan media asset records."""
    # Placeholder for periodic cleanup logic
    logger.info("Periodic cleanup of media assets executed.")
    return 0
