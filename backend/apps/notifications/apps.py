from django.apps import AppConfig
from django.db.models.signals import post_migrate


def create_default_channels(sender, **kwargs):
    from .models import NotificationChannel

    defaults = ["email", "sms", "push", "in_app"]
    for name in defaults:
        NotificationChannel.objects.get_or_create(
            name=name, defaults={"is_active": name != "sms"}
        )


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"
    verbose_name = "Système Notification"

    def ready(self):
        import apps.notifications.signals  # noqa: F401

        post_migrate.connect(create_default_channels, sender=self)
