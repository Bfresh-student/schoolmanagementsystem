from django.contrib import admin

from apps.enrollments.models import Inscription, PreInscription


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


@admin.register(PreInscription)
class PreInscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "reference", "nom", "prenom", "telephone", "email",
        "programme", "status", "created_at",
    )
    list_filter = ("status", "programme", "departement")
    search_fields = ("nom", "prenom", "telephone", "email", "reference")
    readonly_fields = ("reference", "created_at", "updated_at")
