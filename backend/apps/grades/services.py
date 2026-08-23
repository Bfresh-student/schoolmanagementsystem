"""
Sync Manager pour les notes — implémente fidèlement les 3 phases décrites
dans le document (section "Architecture Recommandée : Queue + Conflict
Detection") et le scénario du Cas 2 (16 vs 14).
"""
from django.db import transaction

from .models import Grade, GradeConflict, GradeSyncEntry, SyncEntryStatus
from .signals import grade_conflict_detected, grade_recorded


@transaction.atomic
def process_sync_entry(entry: GradeSyncEntry) -> dict:
    """
    Traite UNE entrée de la queue (locale ou distante).

    Retourne un dict {"outcome": "applied" | "conflict" | "discarded", ...}
    """
    if entry.status != SyncEntryStatus.PENDING:
        return {"outcome": "discarded", "reason": "already processed"}

    lookup = {"student": entry.student, "assessment": entry.assessment} if entry.assessment_id else {"student": entry.student, "course": entry.course}
    existing = Grade.objects.select_for_update().filter(**lookup).first()

    # CAS A : pas de note existante -> application directe (Phase 3, cas A)
    if existing is None:
        grade = Grade.objects.create(
            student=entry.student,
            course=entry.course,
            assessment=entry.assessment,
            teacher=entry.teacher,
            value=entry.value,
            date_graded=entry.local_timestamp.date(),
            synced=True,
        )
        entry.status = SyncEntryStatus.APPLIED
        entry.save(update_fields=["status"])
        grade_recorded.send(sender=Grade, grade=grade, entry=entry)
        return {"outcome": "applied", "grade_id": grade.id}

    # CAS A-bis : valeur identique -> pas de conflit réel, juste confirmer
    if existing.value == entry.value:
        existing.synced = True
        existing.save(update_fields=["synced", "updated_at"])
        entry.status = SyncEntryStatus.APPLIED
        entry.save(update_fields=["status"])
        grade_recorded.send(sender=Grade, grade=existing, entry=entry)
        return {"outcome": "applied", "grade_id": existing.id, "note": "valeur identique"}

    # Une correction en ligne est séquentielle ; seuls les rejouements
    # hors-ligne contradictoires doivent passer par l'arbitrage manuel.
    if entry.source == GradeSyncEntry.Source.REMOTE:
        existing.value = entry.value
        existing.teacher = entry.teacher or existing.teacher
        existing.date_graded = entry.local_timestamp.date()
        existing.synced = True
        existing.save(update_fields=["value", "teacher", "date_graded", "synced", "updated_at"])
        entry.status = SyncEntryStatus.APPLIED
        entry.save(update_fields=["status"])
        grade_recorded.send(sender=Grade, grade=existing, entry=entry)
        return {"outcome": "applied", "grade_id": existing.id, "note": "note mise à jour"}

    # CAS B : CONFLIT — deux valeurs différentes pour le même (student, course).
    # Volontairement PAS d'auto-résolution par Last-Write-Wins, même si
    # `existing.updated_at` est postérieur à `entry.local_timestamp` : une
    # note est une donnée trop sensible pour un arbitrage automatique
    # silencieux (cf. tableau comparatif des approches du document).
    conflict = GradeConflict.objects.create(
        sync_entry=entry,
        grade=existing,
        local_version={
            "value": str(entry.value),
            "source": entry.source,
            "submitted_by": entry.submitted_by_id,
            "timestamp": entry.local_timestamp.isoformat(),
        },
        remote_version={
            "value": str(existing.value),
            "timestamp": existing.updated_at.isoformat(),
        },
    )
    entry.status = SyncEntryStatus.CONFLICT
    entry.save(update_fields=["status"])
    existing.synced = False
    existing.save(update_fields=["synced"])

    grade_conflict_detected.send(sender=GradeConflict, conflict=conflict)
    return {"outcome": "conflict", "conflict_id": conflict.id}


def process_pending_queue(queryset=None) -> list[dict]:
    """
    Traite toutes les entrées PENDING, dans l'ordre chronologique de leur
    `local_timestamp` (rejeu en ordre, cf. tableau des défis du document :
    "Ordre des opérations").
    """
    qs = queryset if queryset is not None else GradeSyncEntry.objects.filter(status=SyncEntryStatus.PENDING)
    results = []
    for entry in qs.order_by("local_timestamp"):
        results.append({"entry_id": entry.id, **process_sync_entry(entry)})
    return results


def submit_grade(*, student, course, teacher, value, source, submitted_by, local_timestamp, local_uuid=None, assessment=None):
    """
    Point d'entrée unique pour saisir une note, que ce soit online ou
    offline. Crée une `GradeSyncEntry` puis la traite immédiatement
    (le traitement immédiat est sûr : online, il n'y a jamais de vraie
    latence ; offline, cette fonction tourne contre le SQLite local puis
    est rejouée contre le serveur via `process_pending_queue` à la
    reconnexion — c'est le même code des deux côtés).
    """
    if local_uuid:
        existing_entry = GradeSyncEntry.objects.filter(local_uuid=local_uuid).first()
        if existing_entry:
            return existing_entry, {"outcome": "discarded", "reason": "duplicate local_uuid"}

    entry_kwargs = dict(
        student=student,
        course=course,
        assessment=assessment,
        teacher=teacher,
        value=value,
        source=source,
        submitted_by=submitted_by,
        local_timestamp=local_timestamp,
    )
    if local_uuid:
        entry_kwargs["local_uuid"] = local_uuid

    entry = GradeSyncEntry.objects.create(**entry_kwargs)
    result = process_sync_entry(entry)
    return entry, result
