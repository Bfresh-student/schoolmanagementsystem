from django.apps import AppConfig

class teachersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.teachers'
    verbose_name = "Gestion Professeur"
    def ready(self):
        import apps.teachers.signals  # noqa: F401
