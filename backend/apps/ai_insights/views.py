from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import InsightRequest
from .serializers import InsightRequestSerializer
from .tasks import generate_insight_task


class InsightRequestViewSet(viewsets.ModelViewSet):
    """CRUD API for AI Insights generation and history.

    Any authenticated user can create a request — the underlying school
    data it can see is scoped per-tool-call to *their own* role via
    apps/ai_insights/tools.py, so there's no privilege escalation risk in
    letting anyone request an insight. What IS restricted here is *whose*
    past insight requests you can browse: your own only, unless you're
    admin/director staff.
    """
    serializer_class = InsightRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = InsightRequest.objects.all().order_by('-created_at')
        role = getattr(self.request.user, "role", None)
        if isinstance(role, str) and role.upper() in ("ADMIN", "DIRECTOR"):
            return qs
        return qs.filter(requested_by=self.request.user)

    def perform_create(self, serializer):
        insight = serializer.save(requested_by=self.request.user)
        generate_insight_task.delay(insight.id)

    @action(detail=True, methods=['post'], url_path='generate')
    def regenerate_insight(self, request, pk=None):
        """Re-trigger Celery task for generating insight."""
        insight = self.get_object()
        task = generate_insight_task.delay(insight.id)
        return Response(
            {"message": f"Insight generation enqueued for request {insight.id}", "task_id": task.id},
            status=status.HTTP_202_ACCEPTED
        )