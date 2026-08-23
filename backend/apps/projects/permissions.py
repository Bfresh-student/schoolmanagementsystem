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

    # `User.role` est un CharField. Ces droits couvrent les ressources du
    # domaine projets sans supposer un modèle Role relationnel inexistant.
    STAFF_ROLES = {"ADMIN", "DIRECTOR"}
    READ_ROLES = {"TEACHER", "SECRETARY", "ACCOUNTANT", "STAFF"}

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        resource = getattr(view, "resource_name", None)
        if resource is None:
            return False

        action = self.ACTION_MAP.get(request.method)
        role = str(getattr(request.user, "role", "")).upper()
        if request.user.is_staff or role in self.STAFF_ROLES:
            return True
        if action == "read" and role in self.READ_ROLES:
            return True
        return False
