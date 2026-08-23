from rest_framework.permissions import SAFE_METHODS, BasePermission


class HasResourcePermission(BasePermission):
    """
    Vérifie que le rôle de l'utilisateur possède la permission
    (resource, action) requise, selon la matrice RBAC du système.
    Reprend le pattern défini dans l'app Gestion Utilisateur.
    """

    ACTION_MAP = {
        "GET": "read",
        "HEAD": "read",
        "OPTIONS": "read",
        "POST": "create",
        "PUT": "update",
        "PATCH": "update",
        "DELETE": "delete",
    }
    ROLE_PERMISSIONS = {
        "ADMIN":     {"teachers": {"create", "read", "update", "delete"}},
        "DIRECTOR":  {"teachers": {"create", "read", "update", "delete"}},
        "TEACHER":   {"teachers": {"read"}},
        "SECRETARY": {"teachers": {"read"}},
        "STUDENT":   {"teachers": set()},
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        resource = getattr(view, "resource_name", None)
        if resource is None:
            return False

        action = self.ACTION_MAP.get(request.method)
        allowed = self.ROLE_PERMISSIONS.get(request.user.role, {}).get(resource, set())
        return action in allowed

class IsSelfTeacherOrAdmin(BasePermission):
    """
    Un professeur ne peut modifier/lire que son propre profil,
    sauf s'il est admin (déjà couvert par HasResourcePermission
    pour la lecture globale). Utilisée en complément sur les
    actions détail (retrieve/update) du ViewSet Teacher.
    """

    def has_object_permission(self, request, view, obj):
        role_name = getattr(getattr(request.user, "role", None), "name", "")
        if role_name == "admin":
            return True
        if request.method in SAFE_METHODS:
            return obj.user_id == request.user.id or role_name == "admin"
        return obj.user_id == request.user.id