from rest_framework.permissions import SAFE_METHODS, BasePermission


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
    STAFF_ROLES = {"ADMIN", "DIRECTOR"}
    READ_ROLES = {"TEACHER", "SECRETARY", "ACCOUNTANT", "STAFF", "STUDENT", "PARENT"}

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


class CanViewPublishedEventOrManage(BasePermission):
    """
    Tout utilisateur authentifié peut consulter un événement publié
    (pas besoin de permission RBAC explicite pour la lecture) ; la
    création/modification reste couverte par HasResourcePermission.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.status in ("published", "ongoing", "completed") or (
                obj.creator_id == request.user.id
            )
        return True  # délégué à HasResourcePermission pour l'écriture
