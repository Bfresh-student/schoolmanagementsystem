"""
Signaux custom émis par l'app Enrollment.

Pourquoi des signaux custom plutôt que des imports directs vers Finance /
Notification ? -> Découplage. D'après le graphe de dépendances du document,
Enrollment est un point central dont dépendent Finance, Notification et AI.
En passant par des signaux, Enrollment n'a besoin de connaître AUCUNE de ces
apps ; ce sont elles qui s'abonnent.
"""
import django.dispatch

# Émis à chaque changement de statut d'une inscription.
# providing_args (informatif, non enforced depuis Django 4) :
#   instance, previous_status, new_status, actor
inscription_status_changed = django.dispatch.Signal()

# Émis spécifiquement quand une inscription passe à "approved".
# C'est CE signal que l'app Finance écoute pour générer la facture,
# et que l'app Notification écoute pour prévenir l'étudiant.
inscription_approved = django.dispatch.Signal()

# Émis quand une inscription est créée hors-ligne puis confirmée par le sync
# manager. L'app AI / Audit peut s'en servir pour ses statistiques.
inscription_synced = django.dispatch.Signal()
