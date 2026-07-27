import uuid

from django.conf import settings
from django.db import models


class SyncQueue(models.Model):
    """Regroupe les opérations d'une session de synchronisation (ex: une
    machine/salle donnée, ou 'default' si l'école n'a qu'un seul site)."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "En pause"
        COMPLETED = "completed", "Terminée"

    queue_name = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    total_operations = models.PositiveIntegerField(default=0)
    operations_completed = models.PositiveIntegerField(default=0)
    last_sync = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "File de synchronisation"
        verbose_name_plural = "Files de synchronisation"

    def __str__(self):
        return self.queue_name

    @property
    def progress_percent(self):
        if not self.total_operations:
            return 100.0
        return round(self.operations_completed / self.total_operations * 100, 1)


class SyncOperation(models.Model):
    """Une opération individuelle (une ligne de queue locale) suivie côté serveur."""

    class OperationType(models.TextChoices):
        INSERT = "insert", "Création"
        UPDATE = "update", "Modification"
        DELETE = "delete", "Suppression"

    class ConflictStatus(models.TextChoices):
        PENDING = "pending", "En attente"
        CONFLICT = "conflict", "Conflit"
        RESOLVED = "resolved", "Résolu"
        SYNCED = "synced", "Synchronisé"
        FAILED = "failed", "Échoué"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    queue = models.ForeignKey(SyncQueue, on_delete=models.CASCADE, related_name="operations")
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="sync_operations"
    )
    operation_type = models.CharField(max_length=10, choices=OperationType.choices)
    table_name = models.CharField(max_length=100)
    # PK côté serveur — vide tant que l'opération n'a pas été appliquée
    # (cas d'un INSERT dont l'id définitif n'existe pas encore côté serveur).
    record_id = models.CharField(max_length=100, blank=True)
    conflict_status = models.CharField(max_length=20, choices=ConflictStatus.choices, default=ConflictStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Opération de synchronisation"
        verbose_name_plural = "Opérations de synchronisation"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["conflict_status"]),
            models.Index(fields=["table_name", "record_id"]),
        ]

    def __str__(self):
        return f"{self.table_name}:{self.record_id or '?'} [{self.conflict_status}]"


class LocalQueueEntry(models.Model):
    """Miroir côté serveur d'une entrée de queue locale envoyée par le
    client offline-first (WatermelonDB)."""

    class Action(models.TextChoices):
        CREATE = "create", "Création"
        UPDATE = "update", "Modification"
        DELETE = "delete", "Suppression"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sync_operation = models.OneToOneField(SyncOperation, on_delete=models.CASCADE, related_name="queue_entry")
    table_name = models.CharField(max_length=100)
    record_id = models.CharField(max_length=100, blank=True)
    action = models.CharField(max_length=10, choices=Action.choices)
    data = models.JSONField()
    local_timestamp = models.DateTimeField()
    # Généré côté client (UUID) — si le même batch est renvoyé après une
    # coupure réseau, on ne rejoue pas l'opération deux fois.
    client_operation_id = models.CharField(max_length=100, unique=True)
    synced = models.BooleanField(default=False)
    has_conflict = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Entrée de queue locale"
        verbose_name_plural = "Entrées de queue locale"
        indexes = [models.Index(fields=["synced"]), models.Index(fields=["has_conflict"])]

    def __str__(self):
        return f"{self.action}:{self.table_name}:{self.record_id or '?'}"


class ConflictResolution(models.Model):
    """Conflit détecté à la synchronisation, en attente de résolution admin."""

    class ConflictType(models.TextChoices):
        VERSION_MISMATCH = "version_mismatch", "Versions différentes"
        DELETED_REMOTELY = "deleted_remotely", "Supprimé côté serveur"
        DUPLICATE_NATURAL_KEY = "duplicate_natural_key", "Doublon (clé naturelle)"

    class Resolution(models.TextChoices):
        LOCAL = "local", "Garder la version locale"
        REMOTE = "remote", "Garder la version distante"
        MANUAL_MERGE = "manual_merge", "Fusion manuelle"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sync_operation = models.OneToOneField(SyncOperation, on_delete=models.CASCADE, related_name="conflict")
    conflict_type = models.CharField(max_length=30, choices=ConflictType.choices)
    local_version = models.JSONField()
    remote_version = models.JSONField(null=True, blank=True)

    resolution_choice = models.CharField(max_length=20, choices=Resolution.choices, blank=True)
    merged_data = models.JSONField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="resolved_conflicts"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Résolution de conflit"
        verbose_name_plural = "Résolutions de conflit"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Conflit {self.conflict_type} sur {self.sync_operation}"

    @property
    def is_resolved(self):
        return bool(self.resolution_choice)


class SyncLog(models.Model):
    """Historique complet — une ligne par tentative, pour audit et retry."""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        IN_PROGRESS = "in_progress", "En cours"
        SUCCESS = "success", "Succès"
        FAILED = "failed", "Échoué"

    sync_operation = models.ForeignKey(SyncOperation, on_delete=models.CASCADE, related_name="logs")
    status = models.CharField(max_length=20, choices=Status.choices)
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Journal de synchronisation"
        verbose_name_plural = "Journaux de synchronisation"
        ordering = ["-logged_at"]

    def __str__(self):
        return f"{self.sync_operation_id} — {self.status}"
