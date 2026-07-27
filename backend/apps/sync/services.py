"""
Moteur de synchronisation offline-first (Queue + Conflict Detection).

Flux :
  1. Le client (WatermelonDB) envoie un batch d'opérations en attente
     (POST /api/sync/batch/).
  2. Pour chaque opération, on rejoue la logique décrite dans l'analyse :
       - INSERT : recherche par clé naturelle. Pas de doublon -> créé direct.
                  Doublon trouvé -> conflit (duplicate_natural_key).
       - UPDATE/DELETE : recherche par record_id.
                  Absent -> conflit (deleted_remotely).
                  Présent mais modifié après le snapshot local -> conflit
                  (version_mismatch).
                  Sinon -> appliqué directement (pas de conflit).
  3. Les conflits sont journalisés dans ConflictResolution ('pending') et
     un admin les résout ensuite via `resolve_conflict`.
"""
import logging

from django.db import transaction
from django.forms.models import model_to_dict
from django.utils import timezone

from .models import ConflictResolution, LocalQueueEntry, SyncLog, SyncOperation, SyncQueue
from .registry import registry

logger = logging.getLogger(__name__)


class SyncError(Exception):
    pass


def _json_safe(value):
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def _serializable_dict(instance):
    raw = model_to_dict(instance)
    return {k: _json_safe(v) for k, v in raw.items()}


class SyncProcessor:

    # -- Point d'entrée principal --------------------------------------

    @staticmethod
    @transaction.atomic
    def process_batch(entries, user, queue_name="default"):
        """entries : liste de dicts {table_name, record_id, action, data,
        local_timestamp, client_operation_id}. Retourne un résultat par
        entrée, dans l'ordre, pour que le client mette à jour sa queue locale."""
        queue, _ = SyncQueue.objects.get_or_create(
            queue_name=queue_name, defaults={"status": SyncQueue.Status.ACTIVE}
        )

        results = [SyncProcessor._process_entry(entry, queue, user) for entry in entries]

        queue.total_operations = queue.operations.count()
        queue.operations_completed = queue.operations.filter(
            conflict_status=SyncOperation.ConflictStatus.SYNCED
        ).count()
        queue.last_sync = timezone.now()
        queue.save(update_fields=["total_operations", "operations_completed", "last_sync"])

        return results

    @staticmethod
    def _process_entry(entry, queue, user):
        client_op_id = entry["client_operation_id"]

        # Idempotence : batch renvoyé après coupure réseau -> ne pas rejouer.
        existing = LocalQueueEntry.objects.filter(client_operation_id=client_op_id).first()
        if existing:
            return SyncProcessor._to_result(existing)

        table_name = entry["table_name"]
        if not registry.is_registered(table_name):
            logger.warning("Table de sync inconnue reçue du client : %s", table_name)
            return {
                "client_operation_id": client_op_id,
                "status": "failed",
                "error": f"Table '{table_name}' non synchronisable.",
            }

        config = registry.get(table_name)
        sync_op = SyncOperation.objects.create(
            queue=queue,
            initiated_by=user,
            operation_type=SyncProcessor._map_action(entry["action"]),
            table_name=table_name,
            record_id=entry.get("record_id", "") or "",
        )
        local_entry = LocalQueueEntry.objects.create(
            sync_operation=sync_op,
            table_name=table_name,
            record_id=entry.get("record_id", "") or "",
            action=entry["action"],
            data=entry["data"],
            local_timestamp=entry["local_timestamp"],
            client_operation_id=client_op_id,
        )

        try:
            SyncProcessor._apply_or_detect_conflict(sync_op, local_entry, config)
        except Exception as exc:  # pragma: no cover - filet de sécurité
            SyncLog.objects.create(sync_operation=sync_op, status=SyncLog.Status.FAILED, error_message=str(exc))
            sync_op.conflict_status = SyncOperation.ConflictStatus.FAILED
            sync_op.save(update_fields=["conflict_status"])
            logger.exception("Échec de synchronisation pour %s", sync_op)

        return SyncProcessor._to_result(local_entry)

    @staticmethod
    def _map_action(action):
        return {
            LocalQueueEntry.Action.CREATE: SyncOperation.OperationType.INSERT,
            LocalQueueEntry.Action.UPDATE: SyncOperation.OperationType.UPDATE,
            LocalQueueEntry.Action.DELETE: SyncOperation.OperationType.DELETE,
        }[action]

    # -- Détection de conflit / application ------------------------------

    @staticmethod
    def _apply_or_detect_conflict(sync_op, local_entry, config):
        model = config["model"]
        timestamp_field = config["timestamp_field"]
        natural_key_fields = config["natural_key_fields"]
        data = local_entry.data
        action = local_entry.action

        if action == LocalQueueEntry.Action.CREATE:
            existing = SyncProcessor._find_by_natural_key(model, natural_key_fields, data)
            if existing is None:
                obj = model.objects.create(**SyncProcessor._clean_data(model, data))
                SyncProcessor._mark_synced(sync_op, local_entry, str(obj.pk))
            else:
                SyncProcessor._flag_conflict(
                    sync_op, local_entry,
                    conflict_type=ConflictResolution.ConflictType.DUPLICATE_NATURAL_KEY,
                    remote_obj=existing,
                )
            return

        record_id = local_entry.record_id
        try:
            obj = model.objects.get(pk=record_id)
        except model.DoesNotExist:
            SyncProcessor._flag_conflict(
                sync_op, local_entry,
                conflict_type=ConflictResolution.ConflictType.DELETED_REMOTELY,
                remote_obj=None,
            )
            return

        remote_ts = getattr(obj, timestamp_field, None)
        local_ts = local_entry.local_timestamp
        if remote_ts and local_ts and remote_ts > local_ts:
            # Le serveur a été modifié après le snapshot que le client avait
            # localement -> on ne sait pas laquelle des deux versions doit
            # gagner, un admin tranche.
            SyncProcessor._flag_conflict(
                sync_op, local_entry,
                conflict_type=ConflictResolution.ConflictType.VERSION_MISMATCH,
                remote_obj=obj,
            )
            return

        if action == LocalQueueEntry.Action.DELETE:
            obj.delete()
        else:
            for field, value in SyncProcessor._clean_data(model, data).items():
                setattr(obj, field, value)
            obj.save()
        SyncProcessor._mark_synced(sync_op, local_entry, record_id)

    @staticmethod
    def _find_by_natural_key(model, natural_key_fields, data):
        if not natural_key_fields:
            return None
        lookup = {f: data.get(f) for f in natural_key_fields}
        if any(v is None for v in lookup.values()):
            return None
        return model.objects.filter(**lookup).first()

    @staticmethod
    def _clean_data(model, data):
        valid_fields = {f.name for f in model._meta.get_fields() if hasattr(f, "attname")}
        return {k: v for k, v in data.items() if k in valid_fields and k != "id"}

    @staticmethod
    def _mark_synced(sync_op, local_entry, record_id):
        sync_op.record_id = record_id
        sync_op.conflict_status = SyncOperation.ConflictStatus.SYNCED
        sync_op.save(update_fields=["record_id", "conflict_status"])
        local_entry.record_id = record_id
        local_entry.synced = True
        local_entry.save(update_fields=["record_id", "synced"])
        SyncLog.objects.create(sync_operation=sync_op, status=SyncLog.Status.SUCCESS)

    @staticmethod
    def _flag_conflict(sync_op, local_entry, conflict_type, remote_obj):
        remote_version = _serializable_dict(remote_obj) if remote_obj is not None else None
        ConflictResolution.objects.create(
            sync_operation=sync_op,
            conflict_type=conflict_type,
            local_version=local_entry.data,
            remote_version=remote_version,
        )
        sync_op.conflict_status = SyncOperation.ConflictStatus.CONFLICT
        sync_op.save(update_fields=["conflict_status"])
        local_entry.has_conflict = True
        local_entry.save(update_fields=["has_conflict"])
        SyncLog.objects.create(
            sync_operation=sync_op, status=SyncLog.Status.PENDING,
            error_message="Conflit détecté — en attente de résolution par un administrateur",
        )
        _notify_conflict(sync_op)

    @staticmethod
    def _to_result(local_entry):
        return {
            "client_operation_id": local_entry.client_operation_id,
            "status": local_entry.sync_operation.conflict_status,
            "record_id": local_entry.record_id,
            "has_conflict": local_entry.has_conflict,
        }

    # -- Résolution manuelle (admin) -------------------------------------

    @staticmethod
    @transaction.atomic
    def resolve_conflict(conflict: ConflictResolution, choice, resolved_by, merged_data=None):
        if conflict.is_resolved:
            return conflict  # idempotent

        config = registry.get(conflict.sync_operation.table_name)
        model = config["model"]

        if choice == ConflictResolution.Resolution.LOCAL:
            data = conflict.local_version
        elif choice == ConflictResolution.Resolution.REMOTE:
            data = conflict.remote_version
            if data is None:
                raise SyncError("Aucune version distante disponible pour ce conflit.")
        elif choice == ConflictResolution.Resolution.MANUAL_MERGE:
            if not merged_data:
                raise SyncError("merged_data requis pour une fusion manuelle.")
            data = merged_data
        else:
            raise SyncError("Choix de résolution invalide.")

        sync_op = conflict.sync_operation
        clean = SyncProcessor._clean_data(model, data)

        if sync_op.record_id:
            obj, _ = model.objects.update_or_create(pk=sync_op.record_id, defaults=clean)
        else:
            obj = model.objects.create(**clean)
            sync_op.record_id = str(obj.pk)

        conflict.resolution_choice = choice
        conflict.merged_data = merged_data if choice == ConflictResolution.Resolution.MANUAL_MERGE else None
        conflict.resolved_by = resolved_by
        conflict.resolved_at = timezone.now()
        conflict.save()

        sync_op.conflict_status = SyncOperation.ConflictStatus.RESOLVED
        sync_op.save(update_fields=["conflict_status", "record_id"])

        local_entry = getattr(sync_op, "queue_entry", None)
        if local_entry:
            local_entry.synced = True
            local_entry.has_conflict = False
            local_entry.record_id = sync_op.record_id
            local_entry.save(update_fields=["synced", "has_conflict", "record_id"])

        SyncLog.objects.create(
            sync_operation=sync_op, status=SyncLog.Status.SUCCESS,
            error_message=f"Conflit résolu : {choice}",
        )
        _notify_resolved(sync_op)
        return obj


def _notify_conflict(sync_op):
    try:
        from notifications.services import trigger_notification
    except ImportError:
        return
    trigger_notification(
        trigger_type="sync_conflict_detected",
        recipient=None,  # à router vers le(s) admin(s) côté implémentation notifications
        context={"table_name": sync_op.table_name, "operation_id": str(sync_op.id)},
    )


def _notify_resolved(sync_op):
    try:
        from notifications.services import trigger_notification
    except ImportError:
        return
    if sync_op.initiated_by_id:
        trigger_notification(
            trigger_type="sync_completed",
            recipient=sync_op.initiated_by,
            context={"table_name": sync_op.table_name},
        )
