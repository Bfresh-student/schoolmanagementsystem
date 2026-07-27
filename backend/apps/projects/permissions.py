from rest_framework.permissions import BasePermission


class HasResourcePermission(BasePermission):
    """
    Même pattern RBAC que les autres apps. Chaque ViewSet définit son
    propre `resource_name` (ex: 'projects', 'internships', 'mentorships',
    'business_plans') pour un contrôle granulaire par sous-module.
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
