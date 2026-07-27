from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.projects.models import Project, ProjectDeliverable, ProjectMember
from apps.projects.permissions import HasResourcePermission
from apps.projects.serializers import (
    ProjectDeliverableSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectMemberSerializer,
)


def _notify(recipient_id, trigger_type, context):
    try:
        from notifications.services import enqueue_notification
    except ImportError:
        return
    enqueue_notification(recipient_id=recipient_id, trigger_type=trigger_type, context=context)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD sur les projets + actions :
      - /projects/{id}/members/            (ajouter/lister les membres)
      - /projects/{id}/deliverables/       (ajouter/lister les livrables)
      - /projects/{id}/deliverables/{did}/submit/
      - /projects/{id}/deliverables/{did}/grade/
      - /projects/{id}/evaluate/           (note finale)
    """

    queryset = Project.objects.select_related("course", "teacher").prefetch_related(
        "members", "deliverables"
    )
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "projects"

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["created_at", "status"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get("course")
        status_filter = self.request.query_params.get("status")
        if course_id:
            qs = qs.filter(course_id=course_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=["get", "post"], url_path="members")
    def members(self, request, pk=None):
        project = self.get_object()
        if request.method == "GET":
            serializer = ProjectMemberSerializer(project.members.all(), many=True)
            return Response(serializer.data)

        serializer = ProjectMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save(project=project)
        _notify(
            recipient_id=None,
            trigger_type="project_member_added",
            context={"project_name": project.name, "student_id": str(member.student_id)},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="deliverables")
    def deliverables(self, request, pk=None):
        project = self.get_object()
        if request.method == "GET":
            serializer = ProjectDeliverableSerializer(project.deliverables.all(), many=True)
            return Response(serializer.data)

        serializer = ProjectDeliverableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["patch"],
        url_path="deliverables/(?P<deliverable_id>[^/.]+)/submit",
    )
    def submit_deliverable(self, request, pk=None, deliverable_id=None):
        deliverable = ProjectDeliverable.objects.get(pk=deliverable_id, project_id=pk)
        deliverable.file_path = request.data.get("file_path", deliverable.file_path)
        deliverable.submitted_by_student_id = request.data.get("student_id")
        deliverable.submitted_at = timezone.now()
        deliverable.status = "submitted"
        deliverable.save(
            update_fields=["file_path", "submitted_by_student_id", "submitted_at", "status"]
        )
        return Response(ProjectDeliverableSerializer(deliverable).data)

    @action(
        detail=True,
        methods=["patch"],
        url_path="deliverables/(?P<deliverable_id>[^/.]+)/grade",
    )
    def grade_deliverable(self, request, pk=None, deliverable_id=None):
        deliverable = ProjectDeliverable.objects.get(pk=deliverable_id, project_id=pk)
        deliverable.grade = request.data.get("grade")
        deliverable.feedback = request.data.get("feedback", "")
        deliverable.status = "graded"
        deliverable.save(update_fields=["grade", "feedback", "status"])

        if deliverable.submitted_by_student_id:
            _notify(
                recipient_id=None,
                trigger_type="deliverable_graded",
                context={
                    "deliverable_name": deliverable.name,
                    "grade": str(deliverable.grade),
                    "student_id": str(deliverable.submitted_by_student_id),
                },
            )
        return Response(ProjectDeliverableSerializer(deliverable).data)

    @action(detail=True, methods=["patch"], url_path="evaluate")
    def evaluate(self, request, pk=None):
        project = self.get_object()
        project.final_grade = request.data.get("final_grade")
        project.status = "evaluated"
        project.save(update_fields=["final_grade", "status"])

        for member in project.members.all():
            _notify(
                recipient_id=None,
                trigger_type="project_evaluated",
                context={
                    "project_name": project.name,
                    "final_grade": str(project.final_grade),
                    "student_id": str(member.student_id),
                },
            )
        return Response(ProjectDetailSerializer(project).data)
