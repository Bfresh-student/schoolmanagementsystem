from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.projects.models import Company, Internship, InternshipLog
from apps.projects.permissions import HasResourcePermission
from apps.projects.serializers import (
    CompanySerializer,
    InternshipDetailSerializer,
    InternshipListSerializer,
    InternshipLogSerializer,
)


def _notify(recipient_id, trigger_type, context):
    try:
        from notifications.services import enqueue_notification
    except ImportError:
        return
    enqueue_notification(recipient_id=recipient_id, trigger_type=trigger_type, context=context)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "companies"
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "sector"]


class InternshipViewSet(viewsets.ModelViewSet):
    """
    CRUD sur les stages + actions :
      - /internships/{id}/logs/       (journal quotidien, saisi offline possible)
      - /internships/{id}/evaluate/   (note finale + certificat)
    """

    queryset = Internship.objects.select_related("company", "mentor").prefetch_related("logs")
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "internships"

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ["start_date", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return InternshipListSerializer
        return InternshipDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student_id")
        status_filter = self.request.query_params.get("status")
        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=["get", "post"], url_path="logs")
    def logs(self, request, pk=None):
        """
        Journal quotidien. Peut être saisi offline par l'étudiant en
        entreprise : `synced=false` tant que non remonté (queue locale
        gérée côté client, comme pour GRADES/ATTENDANCES).
        """
        internship = self.get_object()
        if request.method == "GET":
            serializer = InternshipLogSerializer(internship.logs.all(), many=True)
            return Response(serializer.data)

        serializer = InternshipLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(internship=internship, synced=True)  # créé via API = déjà en ligne
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="evaluate")
    def evaluate(self, request, pk=None):
        internship = self.get_object()
        internship.final_grade = request.data.get("final_grade")
        internship.certificate_path = request.data.get(
            "certificate_path", internship.certificate_path
        )
        internship.status = "completed"
        internship.save(update_fields=["final_grade", "certificate_path", "status"])

        _notify(
            recipient_id=None,
            trigger_type="internship_evaluated",
            context={
                "company_name": internship.company.name,
                "final_grade": str(internship.final_grade),
                "student_id": str(internship.student_id),
            },
        )
        return Response(InternshipDetailSerializer(internship).data)
