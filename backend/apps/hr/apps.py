from django.apps import AppConfig


class HrConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.hr"
    verbose_name = "Gestion RH"

    def ready(self):
        from apps.sync.registry import registry
        from .models import Contract, Salary, Leave, PerformanceEvaluation, HRDocument, AuditLog
        registry.register(
            "hr",
            model=Contract,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        registry.register(
            "hr",
            model=Salary,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        registry.register(
            "hr",
            model=Leave,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        registry.register(
            "hr",
            model=PerformanceEvaluation,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        registry.register(
            "hr",
            model=HRDocument,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        registry.register(
            "hr",
            model=AuditLog,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        # No signals import needed here if not existing
