"""
Permissions RH.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission

HR_STAFF_ROLES = {
    "admin",
    "administrator",
    "director",
    "hr",
    "rh",
    "superadmin",
    "direction",
    "administration",
    "staff",
}


def _role_name(user):
    """Return the role name for a user (lowercase string)."""
    if not user:
        return None
    role = getattr(user, "role", None)
    if isinstance(role, str):
        return role.lower().strip()
    return getattr(role, "name", "").lower().strip() if role else None


def _is_hr_staff(user):
    """Check if user has HR staff / administrative privileges."""
    if not (user and user.is_authenticated):
        return False
    if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
        return True
    role = _role_name(user)
    return role in HR_STAFF_ROLES


class IsHRStaff(BasePermission):
    """Autorise uniquement Admin/HR, y compris pour la lecture (ex: AuditLog)."""

    def has_permission(self, request, view):
        return _is_hr_staff(request.user)


class IsHRStaffOrOwnerReadOnly(BasePermission):
    """
    Écriture réservée à Admin/HR.
    Lecture autorisée en plus au teacher concerné par l'objet (ses propres
    contrats, salaires, congés, évaluations, documents).
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if _is_hr_staff(request.user):
            return True
        return request.method in SAFE_METHODS or view.action == "create_own_leave"

    def has_object_permission(self, request, view, obj):
        if _is_hr_staff(request.user):
            return True
        if request.method not in SAFE_METHODS:
            return False
        employee = getattr(obj, "employee", None)
        return employee is not None and getattr(employee, "user_id", None) == request.user.id
