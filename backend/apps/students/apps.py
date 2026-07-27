from django.apps import AppConfig


class StudentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.students"
    verbose_name = "Gestion Élève"

    def ready(self):
        # Enregistre les signaux (ex: création auto de STUDENTS quand un
        # USER a le rôle "student", audit log, etc.)
        import apps.students.signals  # noqa: F401