from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.projects.models import ProjectDeliverable


@receiver(post_save, sender=ProjectDeliverable)
def on_deliverable_created(sender, instance: ProjectDeliverable, created, **kwargs):
    """Notifie les membres du projet qu'un nouveau livrable est attendu."""
    if not created:
        return
    try:
        from notifications.services import enqueue_notification
    except ImportError:
        return

    for member in instance.project.members.all():
        enqueue_notification(
            recipient_id=None,
            trigger_type="deliverable_created",
            context={
                "project_name": instance.project.name,
                "deliverable_name": instance.name,
                "due_date": instance.due_date.isoformat(),
                "student_id": str(member.student_id),
            },
        )
