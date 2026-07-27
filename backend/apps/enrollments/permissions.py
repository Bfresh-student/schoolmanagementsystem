from rest_framework.permissions import BasePermission, SAFE_METHODS


class InscriptionPermission(BasePermission):
    """
    Matrice appliquée (cf. section Sécurité et Permissions du document) :

      - Student : peut CRÉER sa propre inscription (POST), et LIRE
        uniquement les siennes. Ne peut ni approuver, ni rejeter, ni activer.
      - Teacher : lecture seule sur les inscriptions de ses propres cours.
      - Admin : accès complet (create/read/update/approve/reject).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, "role", None)
        role_name = getattr(role, "name", None)

        if role_name == "admin":
            return True

        if view.action in ("create",):
            return role_name in ("student", "admin")

        if view.action in ("list", "retrieve"):
            return role_name in ("student", "teacher", "admin")

        # approve / reject / transition / destroy réservés à l'admin
        return False

    def has_object_permission(self, request, view, obj):
        role = getattr(request.user, "role", None)
        role_name = getattr(role, "name", None)

        if role_name == "admin":
            return True

        if role_name == "student":
            is_owner = obj.student.user_id == request.user.id
            if view.action in ("retrieve",):
                return is_owner
            if view.action == "create":
                return True
            return False

        if role_name == "teacher":
            if request.method in SAFE_METHODS:
                return obj.course.teacher_id == getattr(request.user, "teacher_profile_id", None)
            return False

        return False
