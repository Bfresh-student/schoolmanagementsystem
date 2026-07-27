from django.contrib import admin

from .models import Grade, GradeConflict, GradeSyncEntry


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "course", "teacher", "value", "synced", "updated_at")
    list_filter = ("synced",)
    search_fields = ("student__user__first_name", "student__user__last_name", "course__name")


@admin.register(GradeSyncEntry)
class GradeSyncEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "course", "source", "value", "status", "local_timestamp")
    list_filter = ("status", "source")
    readonly_fields = ("local_uuid", "created_at")


@admin.register(GradeConflict)
class GradeConflictAdmin(admin.ModelAdmin):
    list_display = ("id", "grade", "resolution_choice", "resolved_by", "resolved_at", "created_at")
    list_filter = ("resolution_choice",)
    readonly_fields = ("sync_entry", "grade", "local_version", "remote_version", "created_at")

    def has_add_permission(self, request):
        return False  # les conflits ne se créent que via le sync manager
