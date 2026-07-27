from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Course, CourseCoTeacher, CoursePrerequisite, CourseSyllabusVersion
from .permissions import CourseWriteRequiresOnline, HasResourcePermission
from .serializers import (
    CourseCoTeacherSerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    CoursePrerequisiteSerializer,
    CourseSyllabusVersionSerializer,
)


class CourseViewSet(viewsets.ModelViewSet):
    """
    CRUD sur le catalogue de cours + actions dédiées :
      - /courses/{id}/add-co-teacher/
      - /courses/{id}/prerequisites/
      - /courses/{id}/publish-syllabus/
      - /courses/{id}/assign-teacher/
    """

    queryset = Course.objects.select_related("specialization", "teacher").prefetch_related(
        "co_teachers", "prerequisites", "syllabus_versions"
    )
    permission_classes = [IsAuthenticated, HasResourcePermission, CourseWriteRequiresOnline]
    resource_name = "courses"

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name"]
    ordering_fields = ["code", "start_date", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return CourseListSerializer
        return CourseDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        specialization_id = self.request.query_params.get("specialization")
        status_filter = self.request.query_params.get("status")
        teacher_id = self.request.query_params.get("teacher")
        if specialization_id:
            qs = qs.filter(specialization_id=specialization_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs

    @action(detail=True, methods=["patch"], url_path="assign-teacher")
    def assign_teacher(self, request, pk=None):
        """Change le professeur responsable du cours."""
        course = self.get_object()
        teacher_id = request.data.get("teacher_id")
        course.teacher_id = teacher_id
        course.save(update_fields=["teacher"])
        return Response(CourseDetailSerializer(course).data)

    @action(detail=True, methods=["post"], url_path="add-co-teacher")
    def add_co_teacher(self, request, pk=None):
        course = self.get_object()
        serializer = CourseCoTeacherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="prerequisites")
    def prerequisites(self, request, pk=None):
        course = self.get_object()
        if request.method == "GET":
            serializer = CoursePrerequisiteSerializer(
                course.prerequisites.all(), many=True
            )
            return Response(serializer.data)

        serializer = CoursePrerequisiteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                obj = serializer.save(course=course)
                obj.full_clean()
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict or exc.messages)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="publish-syllabus")
    def publish_syllabus(self, request, pk=None):
        course = self.get_object()
        last_version = (
            course.syllabus_versions.order_by("-version_number").first()
        )
        next_version = (last_version.version_number + 1) if last_version else 1

        serializer = CourseSyllabusVersionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course, version_number=next_version)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="archive")
    def archive(self, request, pk=None):
        """Archive un cours (ne peut plus recevoir de nouvelles inscriptions)."""
        course = self.get_object()
        course.status = "archived"
        course.save(update_fields=["status"])
        return Response(CourseDetailSerializer(course).data)
