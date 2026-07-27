from django.apps import AppConfig


class CoursesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.courses"
    verbose_name = "Gestion Cours"

    def ready(self):
        from apps.sync.registry import registry
        from .models import Course
        registry.register(
            "courses",
            model=Course,
            natural_key_fields=("code",),
            timestamp_field="updated_at",
        )
        import apps.courses.signals  # noqa: F401
