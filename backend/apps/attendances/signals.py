"""
Signaux custom émis par l'app Attendance.
"""
import django.dispatch

# Émis pour CHAQUE présence appliquée sans conflit (present=True ou False).
attendance_recorded = django.dispatch.Signal()

# Émis spécifiquement pour une ABSENCE appliquée sans conflit -> c'est celui-ci
# que Notification écoute pour prévenir le parent (Cas 3 du document).
absence_recorded = django.dispatch.Signal()

# Émis une fois par lot traité, avec le résumé (ex: "35 étudiants, 2 absences")
# -> notification de fin d'appel au professeur.
attendance_batch_processed = django.dispatch.Signal()

attendance_conflict_detected = django.dispatch.Signal()
attendance_conflict_resolved = django.dispatch.Signal()
