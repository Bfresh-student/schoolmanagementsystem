"""
Point d'entrée unique appelé par les autres apps :

    from notifications.services import enqueue_notification
    enqueue_notification(
        recipient_id=user.id,
        trigger_type="grade_added",
        context={"course_name": "...", "grade": 16},
        priority="normal",          # optionnel, sinon priorité par défaut du trigger
        broadcast_specialization_id=None,  # optionnel, pour diffusion de masse
    )

Ce module ne dépend d'AUCUNE autre app métier (courses, teachers, ...)
pour éviter les imports circulaires : il reçoit toujours des IDs bruts,
jamais d'objets typés.
"""

import logging
from datetime import datetime

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.notifications.models import (
    Notification,
    NotificationChannel,
    NotificationPreference,
    NotificationQueueEntry,
    NotificationTemplate,
    NotificationTrigger,
)

logger = logging.getLogger(__name__)

User = get_user_model()


def _resolve_recipients(recipient_id, broadcast_specialization_id):
    """
    Retourne la liste des User destinataires.

    - recipient_id fourni -> un seul destinataire.
    - broadcast_specialization_id fourni -> tous les étudiants actifs
      de cette spécialisation. Résolu via un import tardif optionnel
      vers l'app 'students' (peut ne pas encore être installée dans
      le projet ; on log un avertissement plutôt que de planter).
    """
    if recipient_id:
        try:
            return [User.objects.get(pk=recipient_id)]
        except User.DoesNotExist:
            logger.warning("enqueue_notification: destinataire %s introuvable", recipient_id)
            return []

    if broadcast_specialization_id:
        try:
            from apps.students.models import Student  # import tardif, app optionnelle
        except ImportError:
            logger.warning(
                "enqueue_notification: diffusion demandée mais l'app 'students' "
                "n'est pas installée — notification ignorée."
            )
            return []

        student_qs = Student.objects.filter(
            specialization_id=broadcast_specialization_id, is_active=True
        ).select_related("user")
        return [s.user for s in student_qs]

    logger.warning("enqueue_notification: ni recipient_id ni broadcast fournis")
    return []


def _get_or_create_default_template(trigger_type, channel):
    """Fallback minimal si aucun NotificationTemplate n'est configuré."""
    template, _ = NotificationTemplate.objects.get_or_create(
        template_key=trigger_type,
        channel=channel,
        defaults={
            "subject_line": trigger_type.replace("_", " ").capitalize(),
            "content_template": "Notification : {trigger_type}",
        },
    )
    return template


def _channel_enabled_for_user(user, trigger_type, channel_name) -> bool:
    pref = NotificationPreference.objects.filter(
        user=user, trigger_type=trigger_type
    ).first()
    if pref is None:
        return True  # pas de préférence explicite -> comportement par défaut (activé)

    field_map = {
        "email": pref.email_enabled,
        "sms": pref.sms_enabled,
        "push": pref.push_enabled,
        "in_app": True,  # toujours actif : c'est la boîte de notifications interne
    }
    return field_map.get(channel_name, True)


@transaction.atomic
def enqueue_notification(
    recipient_id=None,
    trigger_type: str = "",
    context: dict | None = None,
    priority: str | None = None,
    broadcast_specialization_id=None,
):
    """
    Crée une (ou plusieurs) Notification + ses entrées de queue par
    canal actif, en respectant les préférences utilisateur et les
    heures de silence (quiet hours). Ne bloque jamais l'appelant :
    toute erreur est loguée, jamais levée.
    """
    context = context or {}
    recipients = _resolve_recipients(recipient_id, broadcast_specialization_id)
    if not recipients:
        return []

    trigger = NotificationTrigger.objects.filter(trigger_name=trigger_type).first()
    resolved_priority = priority or (trigger.default_priority if trigger else "normal")
    template_key = trigger.template_key if trigger else trigger_type

    active_channels = NotificationChannel.objects.filter(is_active=True)
    created_notifications = []
    now_time = timezone.localtime().time()

    for user in recipients:
        template = None
        in_app_channel = active_channels.filter(name="in_app").first()
        if in_app_channel:
            template = NotificationTemplate.objects.filter(
                template_key=template_key, channel=in_app_channel
            ).first() or _get_or_create_default_template(template_key, in_app_channel)
        subject, content = (
            template.render({**context, "trigger_type": trigger_type})
            if template
            else (trigger_type, str(context))
        )

        notification = Notification.objects.create(
            recipient=user,
            trigger=trigger,
            trigger_type=trigger_type,
            title=subject or trigger_type,
            content=content,
            priority=resolved_priority,
        )
        created_notifications.append(notification)

        for channel in active_channels:
            if not _channel_enabled_for_user(user, trigger_type, channel.name):
                continue

            pref = NotificationPreference.objects.filter(
                user=user, trigger_type=trigger_type
            ).first()
            if (
                pref
                and pref.is_within_quiet_hours(now_time)
                and resolved_priority != "urgent"
                and channel.name != "in_app"
            ):
                continue  # respecte le silence, sauf urgence ou notif interne

            recipient_address = {
                "email": user.email,
                "sms": getattr(user, "phone", ""),
                "push": getattr(user, "device_token", ""),
                "in_app": str(user.id),
            }.get(channel.name, "")

            if channel.name != "in_app" and not recipient_address:
                continue  # pas d'adresse connue pour ce canal -> on saute

            channel_template = NotificationTemplate.objects.filter(
                template_key=template_key, channel=channel
            ).first() or _get_or_create_default_template(template_key, channel)
            channel_subject, channel_content = channel_template.render(
                {**context, "trigger_type": trigger_type}
            )

            entry = NotificationQueueEntry.objects.create(
                notification=notification,
                channel=channel,
                recipient_address=recipient_address,
                status="pending",
                synced=channel.name == "in_app",  # email/sms nécessitent le réseau
            )

            if channel.name != "in_app":
                _dispatch_async(entry.id)

    return created_notifications


def _dispatch_async(queue_entry_id):
    """Déclenche l'envoi asynchrone (Celery) sans bloquer la requête appelante."""
    try:
        from .tasks import send_queued_notification

        send_queued_notification.delay(str(queue_entry_id))
    except Exception:  # Celery non configuré (ex: tests) -> log et on continue
        logger.debug(
            "Celery indisponible : entrée %s laissée en 'pending' pour retry.",
            queue_entry_id,
        )
