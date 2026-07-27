from django.apps import AppConfig


class EnrollmentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.enrollments"
    verbose_name = "Gestion Inscription"

    def ready(self):
        from apps.sync.registry import registry
        from .models import Inscription
        registry.register(
            "enrollments",
            model=Inscription,
            natural_key_fields=("student_id", "course_id"),
            timestamp_field="updated_at",
        )
        from . import receivers  # noqa: F401
