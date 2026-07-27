from rest_framework.permissions import SAFE_METHODS, BasePermission


class AttendancePermission(BasePermission):
    """
    - Student : lecture seule sur ses propres présences.
    - Teacher : lecture + saisie (submit_batch) sur ses propres cours uniquement.
    - Admin : accès complet, y compris résolution de conflits.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role_name = getattr(request.user, "role", None)

        if role_name == "ADMIN":
            return True
        if view.action in ("list", "retrieve"):
            return role_name in ("STUDENT", "TEACHER", "ADMIN")
        if view.action == "submit_batch":
            return role_name == "TEACHER"
        return False  # resolve, destroy... : admin uniquement

    def has_object_permission(self, request, view, obj):
        role_name = getattr(request.user, "role", None)
        if role_name == "ADMIN":
            return True
        if role_name == "STUDENT":
            return request.method in SAFE_METHODS and obj.student.user_id == request.user.id
        if role_name == "TEACHER":
            teacher_profile_id = getattr(request.user, "teacher_profile_id", None)
            return obj.course.teacher_id == teacher_profile_id
        return False
