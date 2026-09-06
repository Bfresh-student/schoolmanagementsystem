from django.apps import AppConfig
from django.db.models.signals import post_migrate


def create_default_channels(sender, **kwargs):
    from .models import NotificationChannel, NotificationTrigger

    defaults = ["email", "sms", "push", "in_app"]
    for name in defaults:
        NotificationChannel.objects.get_or_create(
            name=name, defaults={"is_active": name != "sms"}
        )

    triggers = [
        ("grade_added", "grade_added", "normal"),
        ("article_published", "article_published", "normal"),
        ("event_reminder", "event_reminder", "high"),
        ("event_started", "event_started", "high"),
        ("event_completed", "event_completed", "normal"),
        ("event_published_confirmation", "event_published_confirmation", "normal"),
        ("course_assigned", "course_assigned", "normal"),
        ("course_published", "course_published", "normal"),
        ("deliverable_created", "deliverable_created", "normal"),
        ("deliverable_deadline_reminder", "deliverable_deadline_reminder", "high"),
        ("payment_received", "payment_received", "normal"),
        ("invoice_due_soon", "invoice_due_soon", "high"),
        ("payment_status_update", "payment_status_update", "normal"),
        ("project_member_added", "project_member_added", "normal"),
        ("deliverable_graded", "deliverable_graded", "normal"),
        ("project_evaluated", "project_evaluated", "normal"),
        ("business_plan_evaluated", "business_plan_evaluated", "normal"),
        ("internship_evaluated", "internship_evaluated", "normal"),
        ("sync_conflict_detected", "sync_conflict_detected", "urgent"),
        ("sync_completed", "sync_completed", "low"),
        ("sync_conflicts_stale", "sync_conflicts_stale", "high"),
    ]
    for trigger_name, template_key, priority in triggers:
        NotificationTrigger.objects.get_or_create(
            trigger_name=trigger_name,
            defaults={"template_key": template_key, "default_priority": priority},
        )


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"
    verbose_name = "Système Notification"

    def ready(self):
        import apps.notifications.signals  # noqa: F401

        post_migrate.connect(create_default_channels, sender=self)
