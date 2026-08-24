from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SchoolClass
from .serializers import SchoolClassSerializer
from .models import Specialization, Student
from .permissions import HasResourcePermission, IsOwnerStudentOrStaff
from .serializers import (
    SchoolClassSerializer,
    SpecializationSerializer,
    StudentCreateSerializer,
    StudentPublicSerializer,
    StudentSerializer,
)


class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.select_related('specialization').all()
    serializer_class = SchoolClassSerializer
    resource_name = 'classes'
    permission_classes = [HasResourcePermission]


class SpecializationViewSet(viewsets.ModelViewSet):
    queryset = Specialization.objects.filter(is_active=True)
    serializer_class = SpecializationSerializer
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "specializations"


class StudentViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour Admin/Teacher.
    Un Student authentifié ne voit/édite que son propre profil (lecture seule).
    """

    queryset = Student.objects.select_related("user", "specialization").all()
    permission_classes = [IsAuthenticated, HasResourcePermission, IsOwnerStudentOrStaff]
    resource_name = "students"

    def get_serializer_class(self):
        if self.action == "create":
            return StudentCreateSerializer
        role_name = getattr(self.request.user, "role", None)
        if isinstance(role_name, str):
            role_name = role_name.upper()
        if role_name == "STUDENT":
            return StudentPublicSerializer
        return StudentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role_name = getattr(self.request.user, "role", None)
        if isinstance(role_name, str):
            role_name = role_name.upper()
        if role_name == "STUDENT":
            # Un étudiant ne liste/récupère que son propre profil.
            return qs.filter(user=self.request.user)
        #
        #
        # Filtres pratiques pour Admin/Teacher
        params = self.request.query_params
        if user_id := params.get("user"):
            qs = qs.filter(user_id=user_id)
        if status_filter := params.get("status"):
            qs = qs.filter(status=status_filter)
        if spec_id := params.get("specialization"):
            qs = qs.filter(specialization_id=spec_id)
        if class_id := params.get("school_class"):
            qs = qs.filter(school_class_id=class_id)
        return qs

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """Raccourci: /students/me/ pour l'étudiant connecté."""
        try:
            student = Student.objects.select_related("user", "specialization").get(
                user=request.user
            )
        except Student.DoesNotExist:
            return Response(
                {"detail": "Aucun profil étudiant associé à ce compte."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = StudentPublicSerializer(student)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="anonymize")
    def anonymize(self, request, pk=None):
        """RGPD — droit à l'oubli. Réservé aux admins (HasResourcePermission)."""
        student = self.get_object()
        student.anonymize()
        return Response(
            {"detail": "Profil anonymisé.", "anonymized_at": timezone.now()},
            status=status.HTTP_200_OK,
        )