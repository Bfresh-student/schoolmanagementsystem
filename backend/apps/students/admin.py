from django.contrib import admin

from .models import Specialization, Student


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)
    list_filter = ("is_active",)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        "registration_number", "user", "specialization",
        "status", "is_active", "synced", "enrollment_date",
    )
    list_filter = ("status", "is_active", "specialization", "synced")
    search_fields = ("registration_number", "user__email", "user__first_name", "user__last_name")
    readonly_fields = ("registration_number", "enrollment_date", "created_at", "updated_at")
    autocomplete_fields = ("user", "specialization")