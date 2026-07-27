from rest_framework.permissions import BasePermission


def _is_admin(user):
    return user.is_staff or getattr(getattr(user, "role", None), "name", None) == "admin"


class IsAuthenticatedSyncClient(BasePermission):
    """Tout utilisateur authentifié (prof, admin) peut soumettre un batch —
    la saisie hors-ligne concerne notes, présences, paiements en espèces, etc."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsAdminOnly(BasePermission):
    """La résolution de conflit et la supervision des queues sont réservées
    aux administrateurs — décision qui engage la donnée de vérité."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and _is_admin(request.user))
