"""
Tests du moteur de synchronisation, à l'aide d'un modèle factice
(`DemoRecord`) enregistré directement dans le registre pour ne dépendre
d'aucune autre app métier. Dans le projet réel, les mêmes scénarios
s'appliquent aux modèles Grade/Attendance/Payment enregistrés par leurs
apps respectives.
"""
import uuid
from datetime import timedelta

from django.db import models
from django.test import TransactionTestCase
from django.utils import timezone

from apps.sync.models import ConflictResolution, SyncOperation
from apps.sync.registry import registry
from apps.sync.services import SyncProcessor


class DemoRecord(models.Model):
    """Modèle de test uniquement — clé naturelle (owner_key, slot), à la
    manière de GRADES (student_id, course_id)."""

    owner_key = models.CharField(max_length=50)
    slot = models.CharField(max_length=50)
    value = models.IntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "sync"


registry.register(
    "demo_records", model=DemoRecord, natural_key_fields=("owner_key", "slot"), timestamp_field="updated_at"
)


class SyncBaseTestCase(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        from django.db import connection
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(DemoRecord)

    @classmethod
    def tearDownClass(cls):
        from django.db import connection
        try:
            with connection.schema_editor() as schema_editor:
                schema_editor.delete_model(DemoRecord)
        except Exception:
            pass
        super().tearDownClass()


class SyncBatchInsertTests(SyncBaseTestCase):
    def test_insert_without_conflict_is_synced(self):
        entries = [{
            "table_name": "demo_records",
            "action": "create",
            "data": {"owner_key": "student-1", "slot": "course-1", "value": 16},
            "local_timestamp": timezone.now(),
            "client_operation_id": str(uuid.uuid4()),
        }]
        results = SyncProcessor.process_batch(entries, user=None)
        self.assertEqual(results[0]["status"], SyncOperation.ConflictStatus.SYNCED)
        self.assertEqual(DemoRecord.objects.count(), 1)

    def test_insert_duplicate_natural_key_creates_conflict(self):
        DemoRecord.objects.create(owner_key="student-1", slot="course-1", value=14)
        entries = [{
            "table_name": "demo_records",
            "action": "create",
            "data": {"owner_key": "student-1", "slot": "course-1", "value": 16},
            "local_timestamp": timezone.now(),
            "client_operation_id": str(uuid.uuid4()),
        }]
        results = SyncProcessor.process_batch(entries, user=None)
        self.assertEqual(results[0]["status"], SyncOperation.ConflictStatus.CONFLICT)
        self.assertEqual(ConflictResolution.objects.count(), 1)
        conflict = ConflictResolution.objects.first()
        self.assertEqual(conflict.conflict_type, ConflictResolution.ConflictType.DUPLICATE_NATURAL_KEY)
        self.assertEqual(conflict.remote_version["value"], 14)
        self.assertEqual(conflict.local_version["value"], 16)

    def test_replaying_same_client_operation_id_is_idempotent(self):
        op_id = str(uuid.uuid4())
        entry = {
            "table_name": "demo_records",
            "action": "create",
            "data": {"owner_key": "student-2", "slot": "course-1", "value": 10},
            "local_timestamp": timezone.now(),
            "client_operation_id": op_id,
        }
        SyncProcessor.process_batch([entry], user=None)
        SyncProcessor.process_batch([entry], user=None)  # rejoué après coupure réseau
        self.assertEqual(DemoRecord.objects.filter(owner_key="student-2").count(), 1)


class ConflictResolutionTests(SyncBaseTestCase):
    def test_update_after_remote_change_is_flagged_and_resolvable(self):
        record = DemoRecord.objects.create(owner_key="student-3", slot="course-1", value=10)
        snapshot_time = record.updated_at - timedelta(minutes=5)  # snapshot pris AVANT la modif serveur

        entries = [{
            "table_name": "demo_records",
            "record_id": str(record.pk),
            "action": "update",
            "data": {"owner_key": "student-3", "slot": "course-1", "value": 16},
            "local_timestamp": snapshot_time,
            "client_operation_id": str(uuid.uuid4()),
        }]
        results = SyncProcessor.process_batch(entries, user=None)
        self.assertEqual(results[0]["status"], SyncOperation.ConflictStatus.CONFLICT)

        conflict = ConflictResolution.objects.get(sync_operation__record_id=str(record.pk))
        SyncProcessor.resolve_conflict(conflict, choice=ConflictResolution.Resolution.LOCAL, resolved_by=None)

        record.refresh_from_db()
        self.assertEqual(record.value, 16)
        conflict.refresh_from_db()
        self.assertTrue(conflict.is_resolved)

    def test_update_without_remote_change_applies_directly(self):
        record = DemoRecord.objects.create(owner_key="student-4", slot="course-1", value=10)
        future_snapshot = record.updated_at + timedelta(minutes=1)  # snapshot pris APRÈS la dernière écriture serveur

        entries = [{
            "table_name": "demo_records",
            "record_id": str(record.pk),
            "action": "update",
            "data": {"owner_key": "student-4", "slot": "course-1", "value": 18},
            "local_timestamp": future_snapshot,
            "client_operation_id": str(uuid.uuid4()),
        }]
        results = SyncProcessor.process_batch(entries, user=None)
        self.assertEqual(results[0]["status"], SyncOperation.ConflictStatus.SYNCED)
        record.refresh_from_db()
        self.assertEqual(record.value, 18)
