from rest_framework.permissions import SAFE_METHODS, BasePermission


class GradePermission(BasePermission):
    """
    - Student : lecture seule, uniquement ses propres notes.
    - Teacher : lecture sur ses cours, saisie (submit) uniquement sur ses
      propres cours (vérifié dans la vue via `teacher.courses`).
    - Admin : accès complet, y compris résolution des conflits.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role_name = getattr(getattr(request.user, "role", None), "name", None)

        if role_name == "admin":
            return True
        if view.action in ("list", "retrieve"):
            return role_name in ("student", "teacher", "admin")
        if view.action == "submit":
            return role_name in ("teacher", "admin")
        # resolve_conflict, list_conflicts : admin uniquement
        return False

    def has_object_permission(self, request, view, obj):
        role_name = getattr(getattr(request.user, "role", None), "name", None)
        if role_name == "admin":
            return True
        if role_name == "student":
            return request.method in SAFE_METHODS and obj.student.user_id == request.user.id
        if role_name == "teacher":
            teacher_profile_id = getattr(request.user, "teacher_profile_id", None)
            if request.method in SAFE_METHODS:
                return obj.course.teacher_id == teacher_profile_id
            return obj.course.teacher_id == teacher_profile_id
        return False
