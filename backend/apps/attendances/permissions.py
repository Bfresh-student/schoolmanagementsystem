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
        if view.action in ("list", "retrieve", "by_course", "stats"):
            return role_name in ("STUDENT", "TEACHER", "ADMIN")
        if view.action == "submit_batch":
            return role_name in ("TEACHER", "ADMIN")
        return False  # resolve, destroy... : admin uniquement

    def has_object_permission(self, request, view, obj):
        role_name = getattr(request.user, "role", None)
        if role_name == "ADMIN":
            return True
        if role_name == "STUDENT":
            return request.method in SAFE_METHODS and getattr(obj.student, "user_id", None) == request.user.id
        if role_name == "TEACHER":
            teacher_profile = getattr(request.user, "teacher_profile", None)
            teacher_profile_id = getattr(teacher_profile, "id", None) if teacher_profile else getattr(request.user, "teacher_profile_id", None)
            return obj.course.teacher_id == teacher_profile_id
        return False


class AttendanceConflictPermission(BasePermission):
    """
    Réservé aux admins : liste, détail et résolution des conflits de
    synchronisation d'appel. `AttendanceConflict` n'a pas de `.course`/
    `.student` (seulement `.attendance.course`/`.attendance.student`),
    donc il ne doit jamais partager `AttendancePermission`.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "ADMIN"
        )

    def has_object_permission(self, request, view, obj):
        return bool(request.user and getattr(request.user, "role", None) == "ADMIN")