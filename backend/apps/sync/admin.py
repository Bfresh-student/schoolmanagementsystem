from django.contrib import admin

from .models import ConflictResolution, LocalQueueEntry, SyncLog, SyncOperation, SyncQueue


@admin.register(SyncQueue)
class SyncQueueAdmin(admin.ModelAdmin):
    list_display = ["queue_name", "status", "operations_completed", "total_operations", "progress_percent", "last_sync"]
    list_filter = ["status"]


class LocalQueueEntryInline(admin.StackedInline):
    model = LocalQueueEntry
    extra = 0
    readonly_fields = ["data", "local_timestamp", "client_operation_id", "synced", "has_conflict", "created_at"]
    can_delete = False


@admin.register(SyncOperation)
class SyncOperationAdmin(admin.ModelAdmin):
    list_display = ["id", "table_name", "record_id", "operation_type", "conflict_status", "initiated_by", "created_at"]
    list_filter = ["conflict_status", "operation_type", "table_name"]
    search_fields = ["record_id", "table_name"]
    readonly_fields = ["id", "created_at"]
    inlines = [LocalQueueEntryInline]


@admin.register(ConflictResolution)
class ConflictResolutionAdmin(admin.ModelAdmin):
    list_display = ["id", "conflict_type", "sync_operation", "resolution_choice", "resolved_by", "resolved_at"]
    list_filter = ["conflict_type", "resolution_choice"]
    readonly_fields = ["sync_operation", "conflict_type", "local_version", "remote_version", "created_at"]
    actions = ["resolve_keep_local", "resolve_keep_remote"]

    @admin.action(description="Résoudre : garder la version LOCALE")
    def resolve_keep_local(self, request, queryset):
        self._bulk_resolve(request, queryset, ConflictResolution.Resolution.LOCAL)

    @admin.action(description="Résoudre : garder la version DISTANTE")
    def resolve_keep_remote(self, request, queryset):
        self._bulk_resolve(request, queryset, ConflictResolution.Resolution.REMOTE)

    def _bulk_resolve(self, request, queryset, choice):
        from .services import SyncError, SyncProcessor

        resolved = 0
        for conflict in queryset.filter(resolution_choice=""):
            try:
                SyncProcessor.resolve_conflict(conflict, choice=choice, resolved_by=request.user)
                resolved += 1
            except SyncError:
                continue
        self.message_user(request, f"{resolved} conflit(s) résolu(s).")


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ["sync_operation", "status", "retry_count", "logged_at"]
    list_filter = ["status"]
    readonly_fields = ["sync_operation", "status", "error_message", "logged_at"]
