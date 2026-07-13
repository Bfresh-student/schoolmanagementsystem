from rest_framework.permissions import BasePermission


class IsOwnerOrAdmin(BasePermission):
    """Autoriser l'accès au propriétaire ou à un administrateur"""
    
    def has_object_permission(self, request, view, obj):
        return obj == request.user or request.user.is_admin_user


class IsTeacher(BasePermission):
    """Autoriser seulement les professeurs"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_teacher


class IsStudent(BasePermission):
    """Autoriser seulement les étudiants"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_student


class IsAdminUser(BasePermission):
    """Autoriser seulement les administrateurs"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin_user
