from django.contrib import admin

from apps.enrollments.models import Inscription


@admin.register(Inscription)
class InscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id", "student", "course", "status", "synced",
        "created_offline", "requested_at", "approved_by", "updated_at",
    )
    list_filter = ("status", "synced", "created_offline")
    search_fields = ("student__user__first_name", "student__user__last_name", "course__name")
    readonly_fields = ("local_uuid", "created_at", "updated_at")
    autocomplete_fields = ("student", "course", "approved_by")
