"""
Signaux custom émis par l'app Grades.

Même logique de découplage que pour Enrollment : l'app Notification
s'abonne à ces signaux sans que Grades ait besoin de la connaître.
"""
import django.dispatch

# Émis quand une note est appliquée à Grade SANS conflit
# (première saisie, ou re-saisie identique).
grade_recorded = django.dispatch.Signal()

# Émis dès qu'un conflit est détecté -> déclenche la notification admin
# ("Conflit détecté pour Élève X").
grade_conflict_detected = django.dispatch.Signal()

# Émis quand l'admin a tranché -> notifie le prof ("Sync complétée") et
# l'étudiant ("Votre note : 80/100").
grade_conflict_resolved = django.dispatch.Signal()
