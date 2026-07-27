from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer
from .tasks import process_payment_task, notify_payment_status_task


class PaymentViewSet(viewsets.ModelViewSet):
    """CRUD API for Payment model.
    Includes actions for invoice generation, payment processing, and webhooks.
    """
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer

    @action(detail=True, methods=['post'], url_path='process')
    def process_payment(self, request, pk=None):
        """Asynchronously process a pending payment via Celery task."""
        payment = self.get_object()
        task = process_payment_task.delay(payment.id)
        return Response(
            {"message": f"Payment processing task enqueued for payment {payment.id}.", "task_id": task.id},
            status=status.HTTP_202_ACCEPTED
        )

    @action(detail=True, methods=['post'], url_path='create-invoice')
    def create_invoice(self, request, pk=None):
        """Generate an invoice for a payment."""
        payment = self.get_object()
        notify_payment_status_task.delay(payment.id)
        return Response(
            {"message": f"Invoice request queued for payment {payment.id}."},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='webhook-notify')
    def webhook_notify(self, request):
        """Endpoint for payment gateway webhooks."""
        payment_id = request.data.get("payment_id")
        if payment_id:
            process_payment_task.delay(payment_id)
            return Response({"detail": "Webhook received and processing task queued."}, status=status.HTTP_202_ACCEPTED)
        return Response({"detail": "Webhook received with no payment_id."}, status=status.HTTP_200_OK)
 
