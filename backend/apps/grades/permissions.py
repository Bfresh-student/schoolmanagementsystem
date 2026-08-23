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
        role_name = request.user.role

        if role_name in ("ADMIN", "DIRECTOR"):
            return True
        if view.action in ("list", "retrieve"):
            return role_name in ("STUDENT", "TEACHER", "ADMIN", "DIRECTOR")
        if view.action in ("submit", "sync_batch"):
            return role_name in ("TEACHER", "ADMIN", "DIRECTOR")
        # resolve_conflict, list_conflicts : admin uniquement
        return False

    def has_object_permission(self, request, view, obj):
        role_name = request.user.role
        if role_name in ("ADMIN", "DIRECTOR"):
            return True
        if role_name == "STUDENT":
            return request.method in SAFE_METHODS and obj.student.user_id == request.user.id
        if role_name == "TEACHER":
            teacher_profile_id = getattr(request.user, "teacher_profile_id", None)
            if request.method in SAFE_METHODS:
                return obj.course.teacher_id == teacher_profile_id
            return obj.course.teacher_id == teacher_profile_id
        return False
