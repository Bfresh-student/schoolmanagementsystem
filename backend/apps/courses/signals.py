from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Course


@receiver(pre_save, sender=Course)
def cache_previous_status(sender, instance: Course, **kwargs):
    """Garde en mémoire l'ancien statut pour détecter une transition."""
    if instance.pk:
        try:
            instance._previous_status = Course.objects.get(pk=instance.pk).status
        except Course.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


@receiver(post_save, sender=Course)
def on_course_saved(sender, instance: Course, created, **kwargs):
    """
    - À la création : notifie le professeur assigné (s'il existe déjà).
    - Au passage à 'active' : notifie les étudiants de la spécialisation
      concernée qu'un nouveau cours est disponible pour inscription
      (trigger 'course_published' de l'app Notification).
    """
    try:
        from apps.notifications.services import enqueue_notification  # app externe
    except ImportError:
        enqueue_notification = None

    if enqueue_notification is None:
        return

    if created and instance.teacher_id:
        enqueue_notification(
            recipient_id=instance.teacher.user_id,
            trigger_type="course_assigned",
            context={"course_code": instance.code, "course_name": instance.name},
        )

    previous_status = getattr(instance, "_previous_status", None)
    if previous_status != "active" and instance.status == "active":
        enqueue_notification(
            recipient_id=None,  # diffusion large, gérée par la spécialisation
            trigger_type="course_published",
            context={
                "course_code": instance.code,
                "specialization": instance.specialization.name,
            },
            broadcast_specialization_id=str(instance.specialization_id),
        )
