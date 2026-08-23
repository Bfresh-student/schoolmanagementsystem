from rest_framework.permissions import BasePermission, SAFE_METHODS


def _is_admin(user):
    """
    ⚠️ CORRIGÉ : `user.role` est un CharField/TextChoices qui contient
    directement la valeur du rôle (ex. "ADMIN"), pas une relation vers un
    modèle Role avec un attribut `.name`. L'ancienne version
    (`getattr(getattr(user, "role", None), "name", None) == "admin"`)
    renvoyait toujours False, car une string n'a pas d'attribut `.name` et
    la comparaison était en plus sensible à la casse ("admin" != "ADMIN").
    On normalise en majuscules pour rester robuste peu importe la casse
    utilisée en base.
    """
    role = getattr(user, "role", None)
    return bool(user.is_staff or (role and str(role).upper() == "ADMIN"))


class IsOwnerStudentOrAdmin(BasePermission):
    """Un étudiant ne voit que ses propres factures/paiements ; l'admin voit tout."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if _is_admin(request.user):
            return True
        student = getattr(obj, "student", obj)
        return getattr(student, "user_id", None) == request.user.id


class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and _is_admin(request.user))


class ReadOnlyOrAdmin(BasePermission):
    """Utilisé pour PaymentMethod : tout utilisateur authentifié peut lire
    la liste des moyens de paiement actifs, seul l'admin peut la modifier."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return _is_admin(request.user)