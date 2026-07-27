"""
Sync Manager pour les présences — optimisé pour le traitement en LOT
(Cas 3 du document : appel de 35 étudiants, synchronisé en un seul batch
à la reconnexion). Contrairement à Grades où chaque saisie est unitaire,
ici on minimise le nombre de requêtes SQL :

  1. UNE requête pour charger toutes les présences déjà en base concernées
     par le lot (regroupées par cours + date).
  2. bulk_create() pour les nouvelles présences.
  3. bulk_update() pour confirmer celles identiques (marquer synced=True).
  4. Création individuelle de `AttendanceConflict` uniquement pour les rares
     désaccords (cas exceptionnel, donc pas besoin d'optimiser ce chemin).
"""
from django.db import transaction

from .models import (
    Attendance,
    AttendanceConflict,
    AttendanceSyncEntry,
    SyncEntryStatus,
)
from .signals import (
    absence_recorded,
    attendance_batch_processed,
    attendance_conflict_detected,
    attendance_recorded,
)


@transaction.atomic
def process_sync_entries(entries: list) -> dict:
    """
    Traite un lot d'entrées PENDING en minimisant les allers-retours DB.
    Retourne un résumé : {"applied": n, "conflicts": n, "absences": n}.
    """
    entries = [e for e in entries if e.status == SyncEntryStatus.PENDING]
    if not entries:
        return {"applied": 0, "conflicts": 0, "absences": 0, "conflict_ids": []}

    # --- 1. Charger l'existant en UNE requête (regroupé par course+date) ---
    course_date_pairs = {(e.course_id, e.attendance_date) for e in entries}
    existing_qs = Attendance.objects.filter(
        course_id__in={c for c, _ in course_date_pairs},
        attendance_date__in={d for _, d in course_date_pairs},
    )
    existing_by_key = {(a.student_id, a.course_id, a.attendance_date): a for a in existing_qs}

    to_create = []
    to_confirm_ids = []
    conflicts_created = []
    applied_entry_ids = []
    absences = []

    for entry in entries:
        key = (entry.student_id, entry.course_id, entry.attendance_date)
        existing = existing_by_key.get(key)

        if existing is None:
            to_create.append(
                Attendance(
                    student_id=entry.student_id,
                    course_id=entry.course_id,
                    teacher_id=entry.teacher_id,
                    attendance_date=entry.attendance_date,
                    present=entry.present,
                    reason_if_absent=entry.reason_if_absent,
                    synced=True,
                )
            )
            applied_entry_ids.append(entry.id)
            if not entry.present:
                absences.append(entry)
            continue

        same_value = existing.present == entry.present and (existing.reason_if_absent or "") == (
            entry.reason_if_absent or ""
        )
        if same_value:
            to_confirm_ids.append(existing.id)
            applied_entry_ids.append(entry.id)
            continue

        # Désaccord réel -> conflit, traité individuellement (cas rare)
        conflict = AttendanceConflict.objects.create(
            sync_entry=entry,
            attendance=existing,
            local_version={
                "present": entry.present,
                "reason_if_absent": entry.reason_if_absent,
                "source": entry.source,
                "timestamp": entry.local_timestamp.isoformat(),
            },
            remote_version={
                "present": existing.present,
                "reason_if_absent": existing.reason_if_absent,
                "timestamp": existing.updated_at.isoformat(),
            },
        )
        existing.synced = False
        existing.save(update_fields=["synced"])
        conflicts_created.append(conflict)

    # --- 2. Écritures en masse ---
    created = Attendance.objects.bulk_create(to_create)
    if to_confirm_ids:
        Attendance.objects.filter(id__in=to_confirm_ids).update(synced=True)

    AttendanceSyncEntry.objects.filter(id__in=applied_entry_ids).update(status=SyncEntryStatus.APPLIED)
    AttendanceSyncEntry.objects.filter(
        id__in=[c.sync_entry_id for c in conflicts_created]
    ).update(status=SyncEntryStatus.CONFLICT)

    # --- 3. Signaux (hors boucle SQL, sur les nouvelles présences seulement) ---
    for attendance in created:
        attendance_recorded.send(sender=Attendance, attendance=attendance)
        if not attendance.present:
            absence_recorded.send(sender=Attendance, attendance=attendance)

    for conflict in conflicts_created:
        attendance_conflict_detected.send(sender=AttendanceConflict, conflict=conflict)

    summary = {
        "applied": len(to_create) + len(to_confirm_ids),
        "conflicts": len(conflicts_created),
        "absences": len(absences),
        "conflict_ids": [c.id for c in conflicts_created],
    }
    attendance_batch_processed.send(sender=Attendance, summary=summary, entries=entries)
    return summary


def submit_attendance_batch(*, items: list, course, teacher, attendance_date, source, submitted_by) -> dict:
    """
    Point d'entrée pour un appel complet (Cas 3 du document).

    `items` : liste de dicts {"student": Student|id, "present": bool,
              "reason_if_absent": str|None, "local_timestamp": datetime,
              "local_uuid": UUID|None}

    Idempotence : les items dont le `local_uuid` existe déjà sont ignorés
    (replay réseau après une reconnexion instable), sans re-création ni
    re-traitement.
    """
    incoming_uuids = {i["local_uuid"] for i in items if i.get("local_uuid")}
    already_seen = set(
        AttendanceSyncEntry.objects.filter(local_uuid__in=incoming_uuids).values_list("local_uuid", flat=True)
    ) if incoming_uuids else set()

    entries_to_create = []
    for item in items:
        if item.get("local_uuid") and item["local_uuid"] in already_seen:
            continue

        student_value = item["student"]
        student_id = student_value.pk if hasattr(student_value, "pk") else student_value

        entry = AttendanceSyncEntry(
            student_id=student_id,
            course=course,
            teacher=teacher,
            attendance_date=attendance_date,
            present=item["present"],
            reason_if_absent=item.get("reason_if_absent"),
            source=source,
            submitted_by=submitted_by,
            local_timestamp=item["local_timestamp"],
        )
        if item.get("local_uuid"):
            entry.local_uuid = item["local_uuid"]
        entries_to_create.append(entry)

    created_entries = AttendanceSyncEntry.objects.bulk_create(entries_to_create)
    summary = process_sync_entries(created_entries)
    summary["skipped_duplicates"] = len(already_seen)
    return summary
