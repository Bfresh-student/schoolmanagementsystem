from django.apps import AppConfig


class AttendanceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.attendances"
    verbose_name = "Gestion Présence"

    def ready(self):
        from apps.sync.registry import registry
        from .models import Attendance
        registry.register(
            "attendances",
            model=Attendance,
            natural_key_fields=("student_id", "course_id", "attendance_date"),
            timestamp_field="updated_at",
        )
