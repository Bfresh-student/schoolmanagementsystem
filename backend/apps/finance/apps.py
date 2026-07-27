from django.apps import AppConfig


class FinanceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.finance"
    verbose_name = "Gestion Finance"

    def ready(self):
        from apps.sync.registry import registry
        from .models import Invoice, Payment, Receipt
        registry.register(
            "finance",
            model=Invoice,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        registry.register(
            "finance",
            model=Payment,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        registry.register(
            "finance",
            model=Receipt,
            natural_key_fields=("id",),
            timestamp_field="updated_at",
        )
        from . import signals  # noqa: F401
