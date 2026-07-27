from django.apps import AppConfig


class GradesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.grades"
    verbose_name = "Gestion Note"

    def ready(self):
        from apps.sync.registry import registry
        from .models import Grade
        registry.register(
            "grades",
            model=Grade,
            natural_key_fields=("student_id", "course_id"),
            timestamp_field="updated_at",
        )
