from rest_framework.permissions import BasePermission, SAFE_METHODS


class HasResourcePermission(BasePermission):
    """
    Permission RBAC basée sur le rôle du compte utilisateur.
    Les comptes admin/director passent, les enseignants ont un accès
    en lecture seule, et les étudiants ont un accès limité à la lecture.
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
        action = self.ACTION_MAP.get(request.method)
        if resource is None or action is None:
            return False

        if getattr(request.user, "is_admin_user", False):
            return True

        role = getattr(request.user, "role", None)
        if not isinstance(role, str):
            return False

        role = role.upper()
        allowed_actions = {
            "TEACHER": {
                "students": {"read"},
                "specializations": {"read"},
            },
            "STUDENT": {
                "students": {"read"},
                "specializations": {"read"},
            },
        }

        return action in allowed_actions.get(role, {}).get(resource, set())


class IsOwnerStudentOrStaff(BasePermission):
    """
    Un étudiant ne peut voir/modifier QUE son propre profil.
    Admin/Teacher (déjà validés par HasResourcePermission) passent toujours.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        role_name = getattr(user, "role", None)

        if not isinstance(role_name, str):
            return False

        role_name = role_name.upper()

        if user.is_admin_user or role_name == "TEACHER":
            return True

        if role_name == "STUDENT":
            is_self = obj.user_id == user.id
            if request.method in SAFE_METHODS:
                return is_self
            # Un étudiant ne peut jamais modifier son propre profil sensible
            return False

        return False