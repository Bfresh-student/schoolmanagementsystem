from django.contrib import admin

from .models import Attendance, AttendanceConflict, AttendanceSyncEntry


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "course", "attendance_date", "present", "synced")
    list_filter = ("present", "synced", "attendance_date")
    search_fields = ("student__user__first_name", "student__user__last_name", "course__name")
    date_hierarchy = "attendance_date"


@admin.register(AttendanceSyncEntry)
class AttendanceSyncEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "course", "attendance_date", "present", "source", "status")
    list_filter = ("status", "source")
    readonly_fields = ("local_uuid", "created_at")


@admin.register(AttendanceConflict)
class AttendanceConflictAdmin(admin.ModelAdmin):
    list_display = ("id", "attendance", "resolution_choice", "resolved_by", "resolved_at")
    list_filter = ("resolution_choice",)
    readonly_fields = ("sync_entry", "attendance", "local_version", "remote_version", "created_at")

    def has_add_permission(self, request):
        return False
