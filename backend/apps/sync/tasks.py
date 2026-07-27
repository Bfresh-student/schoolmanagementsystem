import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)

MAX_RETRIES = 5


@shared_task
def retry_failed_operations():
    """À planifier périodiquement : rejoue les opérations tombées en échec
    technique (ex: erreur transitoire base de données), en respectant un
    plafond de tentatives pour éviter une boucle infinie."""
    from .models import SyncLog, SyncOperation
    from .services import SyncProcessor

    failed_ops = SyncOperation.objects.filter(conflict_status=SyncOperation.ConflictStatus.FAILED)
    retried, gave_up = 0, 0

    for sync_op in failed_ops:
        last_log = sync_op.logs.order_by("-logged_at").first()
        retry_count = (last_log.retry_count if last_log else 0) + 1
        if retry_count > MAX_RETRIES:
            gave_up += 1
            continue

        local_entry = getattr(sync_op, "queue_entry", None)
        if not local_entry:
            continue

        from .registry import registry

        if not registry.is_registered(sync_op.table_name):
            continue

        config = registry.get(sync_op.table_name)
        try:
            SyncProcessor._apply_or_detect_conflict(sync_op, local_entry, config)  # noqa: SLF001
            retried += 1
        except Exception as exc:
            SyncLog.objects.create(
                sync_operation=sync_op, status=SyncLog.Status.FAILED,
                error_message=str(exc), retry_count=retry_count,
            )
            logger.warning("Nouvel échec pour %s (tentative %s)", sync_op, retry_count)

    logger.info("Retry sync : %s rejouées, %s abandonnées (max tentatives atteint)", retried, gave_up)
    return {"retried": retried, "gave_up": gave_up}


@shared_task
def alert_stale_conflicts(hours=24):
    """Notifie les admins des conflits non résolus depuis plus de `hours`
    heures — un conflit oublié bloque la mise à jour de la donnée concernée."""
    from .models import ConflictResolution

    threshold = timezone.now() - timedelta(hours=hours)
    stale = ConflictResolution.objects.filter(resolution_choice="", created_at__lt=threshold)
    count = stale.count()

    if count:
        try:
            from notifications.services import trigger_notification
        except ImportError:
            logger.info("%s conflit(s) en attente depuis plus de %sh (app notifications absente).", count, hours)
            return count
        trigger_notification(
            trigger_type="sync_conflicts_stale",
            recipient=None,
            context={"count": count, "hours": hours},
        )
    return count


@shared_task
def purge_old_sync_logs(days=90):
    """Nettoyage périodique — ne purge que les journaux liés à des
    opérations déjà synchronisées ou résolues, jamais les conflits en attente."""
    from .models import SyncLog, SyncOperation

    threshold = timezone.now() - timedelta(days=days)
    qs = SyncLog.objects.filter(
        logged_at__lt=threshold,
        sync_operation__conflict_status__in=[
            SyncOperation.ConflictStatus.SYNCED,
            SyncOperation.ConflictStatus.RESOLVED,
        ],
    )
    count = qs.count()
    qs.delete()
    logger.info("%s ligne(s) de SyncLog purgée(s)", count)
    return count
