from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import InsightRequest
from .serializers import InsightRequestSerializer
from .tasks import generate_insight_task


class InsightRequestViewSet(viewsets.ModelViewSet):
    """CRUD API for AI Insights generation and history."""
    queryset = InsightRequest.objects.all().order_by('-created_at')
    serializer_class = InsightRequestSerializer

    def perform_create(self, serializer):
        requested_by = self.request.user if self.request.user.is_authenticated else None
        insight = serializer.save(requested_by=requested_by)
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
