from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.projects.models import Mentorship, MentorshipSession
from apps.projects.permissions import HasResourcePermission
from apps.projects.serializers import MentorshipSerializer, MentorshipSessionSerializer


class MentorshipViewSet(viewsets.ModelViewSet):
    """
    CRUD sur les relations de mentorat + action :
      - /mentorships/{id}/sessions/   (ajouter/lister les séances)
    """

    queryset = Mentorship.objects.select_related("teacher").prefetch_related("sessions")
    serializer_class = MentorshipSerializer
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "mentorships"

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student_id")
        teacher_id = self.request.query_params.get("teacher")
        if student_id:
            qs = qs.filter(student_id=student_id)
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs

    @action(detail=True, methods=["get", "post"], url_path="sessions")
    def sessions(self, request, pk=None):
        mentorship = self.get_object()
        if request.method == "GET":
            serializer = MentorshipSessionSerializer(mentorship.sessions.all(), many=True)
            return Response(serializer.data)

        serializer = MentorshipSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(mentorship=mentorship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
