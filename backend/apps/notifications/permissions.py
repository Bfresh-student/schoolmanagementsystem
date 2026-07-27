from rest_framework.permissions import BasePermission


class HasResourcePermission(BasePermission):
    """Même pattern RBAC que les autres apps (resource, action)."""

    ACTION_MAP = {
        "GET": "read",
        "HEAD": "read",
        "OPTIONS": "read",
        "POST": "create",
        "PUT": "update",
        "PATCH": "update",
        "DELETE": "delete",
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        resource = getattr(view, "resource_name", None)
        if resource is None:
            return False

        action = self.ACTION_MAP.get(request.method)
        role = getattr(request.user, "role", None)
        if role is None:
            return False

        return role.permissions.filter(resource=resource, action=action).exists()


class IsOwnNotification(BasePermission):
    """
    Une notification n'appartient qu'à son destinataire : aucun rôle,
    même admin, ne doit lire la boîte de notification d'un autre
    utilisateur via cet endpoint (l'admin dispose de ses propres
    outils d'audit — AUDIT_LOG — pour ça).
    """

    def has_object_permission(self, request, view, obj):
        return obj.recipient_id == request.user.id
