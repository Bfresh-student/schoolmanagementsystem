"""
Permissions RH.

Hypothèse : `request.user.role.name` existe (cf. app Gestion Utilisateur,
modèle ROLES du document parent) et vaut par exemple "student", "teacher",
"admin", "hr", "parent".

Par défaut, "admin" ET "hr" ont les mêmes droits d'écriture sur cette app
(cf. note dans la spec — à restreindre si le client veut séparer les deux
rôles strictement : il suffirait de retirer "admin" de HR_STAFF_ROLES).
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission

HR_STAFF_ROLES = {"admin", "director"}


def _role_name(user):
    """Return the role name for a user.
    Handles both a string stored in the `role` CharField and a potential
    related Role object with a `name` attribute.
    """
    role = getattr(user, "role", None)
    # If role is stored as a string (the usual case), return it lower‑cased
    if isinstance(role, str):
        return role.lower()
    # Fallback for a Role model instance with a `name` field
    return getattr(role, "name", None)



class IsHRStaff(BasePermission):
    """Autorise uniquement Admin/HR, y compris pour la lecture (ex: AuditLog)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and _role_name(request.user) in HR_STAFF_ROLES
        )


class IsHRStaffOrOwnerReadOnly(BasePermission):
    """
    Écriture réservée à Admin/HR.
    Lecture autorisée en plus au teacher concerné par l'objet (ses propres
    contrats, salaires, congés, évaluations, documents).
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if _role_name(request.user) in HR_STAFF_ROLES:
            return True
        # Les teachers ne peuvent que lister/lire leurs propres objets
        # (le filtrage du queryset se fait dans la view), et créer une
        # demande de congé (cas particulier géré par la view elle-même).
        return request.method in SAFE_METHODS or view.action == "create_own_leave"

    def has_object_permission(self, request, view, obj):
        if _role_name(request.user) in HR_STAFF_ROLES:
            return True
        if request.method not in SAFE_METHODS:
            return False
        employee = getattr(obj, "employee", None)
        return employee is not None and getattr(employee, "user_id", None) == request.user.id
