"""
Receivers internes à l'app Enrollment.

Ce fichier NE contient PAS la logique de facturation ni de notification :
celles-ci vivent dans les apps Finance / Notification respectivement, qui
s'abonnent elles-mêmes à `inscription_approved`. Ici on ne fait que :
  1. Relayer le signal générique vers le signal spécifique "approved"
     (plus pratique à consommer pour Finance/Notification).
  2. Écrire l'AUDIT_LOG (traçabilité légale, cf. section Sécurité du doc).
"""
from django.dispatch import receiver

from .signals import inscription_approved, inscription_status_changed


@receiver(inscription_status_changed)
def relay_approved_signal(sender, instance, previous_status, new_status, actor, **kwargs):
    if new_status == "approved":
        inscription_approved.send(sender=sender, instance=instance, actor=actor)


@receiver(inscription_status_changed)
def write_audit_log(sender, instance, previous_status, new_status, actor, **kwargs):
    try:
        # pyrefly: ignore [missing-import]
        from apps.audit.models import AuditLog  # app séparée, cf. section RH/Sécurité du doc
    except ImportError:
        return  # app audit pas encore installée dans ce projet

    AuditLog.objects.create(
        user=actor,
        action="update",
        entity_type="inscription",
        entity_id=instance.id,
        old_values={"status": previous_status},
        new_values={"status": new_status},
    )


# ----------------------------------------------------------------------
# Exemple (à placer dans apps/finance/receivers.py) de ce que Finance ferait :
#
# @receiver(inscription_approved)
# def generate_invoice_on_approval(sender, instance, actor, **kwargs):
#     from .services import create_invoice_for_inscription
#     create_invoice_for_inscription(instance)
#
# Exemple (à placer dans apps/notifications/receivers.py) :
#
# @receiver(inscription_approved)
# def notify_student_on_approval(sender, instance, actor, **kwargs):
#     from .services import send_notification
#     send_notification(
#         recipient=instance.student.user,
#         trigger_type="inscription_approved",
#         context={"course": instance.course.name},
#     )
# ----------------------------------------------------------------------
