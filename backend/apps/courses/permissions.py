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


class CourseWriteRequiresOnline(BasePermission):
    """
    Les cours sont une donnée de RÉFÉRENCE synchronisée en one-way
    (cloud -> local). Toute écriture (create/update/delete) doit donc
    passer par le backend en ligne — jamais via une queue offline
    locale, contrairement aux notes/présences.

    Le client envoie l'en-tête 'X-Client-Mode: offline' lorsqu'il
    tente une écriture depuis le cache local ; on la refuse ici pour
    éviter toute confusion avec un vrai enregistrement serveur.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.headers.get("X-Client-Mode") != "offline"
