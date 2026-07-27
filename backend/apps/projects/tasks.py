from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.projects.models import ProjectDeliverable


@shared_task
def send_deliverable_deadline_reminders():
    """Rappel Celery beat pour les livrables dus dans les prochaines 48h."""
    try:
        from notifications.services import enqueue_notification
    except ImportError:
        return

    now = timezone.now()
    window_end = now + timedelta(hours=48)
    upcoming = ProjectDeliverable.objects.filter(
        status="pending", due_date__gte=now, due_date__lte=window_end
    ).select_related("project")

    for deliverable in upcoming:
        for member in deliverable.project.members.all():
            enqueue_notification(
                recipient_id=None,
                trigger_type="deliverable_deadline_reminder",
                context={
                    "project_name": deliverable.project.name,
                    "deliverable_name": deliverable.name,
                    "due_date": deliverable.due_date.isoformat(),
                    "student_id": str(member.student_id),
                },
            )
