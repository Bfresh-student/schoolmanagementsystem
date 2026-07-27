from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.projects.models import BusinessPlan
from apps.projects.permissions import HasResourcePermission
from apps.projects.serializers import BusinessPlanPresentationSerializer, BusinessPlanSerializer


def _notify(recipient_id, trigger_type, context):
    try:
        from notifications.services import enqueue_notification
    except ImportError:
        return
    enqueue_notification(recipient_id=recipient_id, trigger_type=trigger_type, context=context)


class BusinessPlanViewSet(viewsets.ModelViewSet):
    """
    CRUD sur les business plans + action :
      - /business-plans/{id}/presentations/   (ajouter/lister les soutenances)
      - /business-plans/{id}/submit/          (passage en évaluation)
    """

    queryset = BusinessPlan.objects.prefetch_related("presentations")
    serializer_class = BusinessPlanSerializer
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = "business_plans"

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student_id")
        status_filter = self.request.query_params.get("status")
        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=["patch"], url_path="submit")
    def submit(self, request, pk=None):
        plan = self.get_object()
        plan.status = "submitted"
        plan.save(update_fields=["status"])
        return Response(BusinessPlanSerializer(plan).data)

    @action(detail=True, methods=["get", "post"], url_path="presentations")
    def presentations(self, request, pk=None):
        plan = self.get_object()
        if request.method == "GET":
            serializer = BusinessPlanPresentationSerializer(
                plan.presentations.all(), many=True
            )
            return Response(serializer.data)

        serializer = BusinessPlanPresentationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        presentation = serializer.save(business_plan=plan)

        if presentation.score is not None:
            plan.final_grade = presentation.score
            plan.status = "approved" if presentation.score >= 10 else "rejected"
            plan.save(update_fields=["final_grade", "status"])
            _notify(
                recipient_id=None,
                trigger_type="business_plan_evaluated",
                context={
                    "business_name": plan.business_name,
                    "score": str(presentation.score),
                    "student_id": str(plan.student_id),
                },
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
