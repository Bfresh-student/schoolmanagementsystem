import json
import logging

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Invoice, Payment, PaymentMethod
from .permissions import IsAdminOnly, IsOwnerStudentOrAdmin, ReadOnlyOrAdmin
from .serializers import (
    InvoiceDetailSerializer,
    InvoiceSerializer,
    PaymentCreateSerializer,
    PaymentMethodSerializer,
    PaymentSerializer,
)
from .services import PaymentError, PaymentService

logger = logging.getLogger(__name__)


def _is_admin(user):
    return user.is_staff or getattr(getattr(user, "role", None), "name", None) == "admin"


class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    permission_classes = [ReadOnlyOrAdmin]


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """Lecture seule côté API : les factures sont créées par le signal
    d'inscription, jamais directement par un client."""

    permission_classes = [IsOwnerStudentOrAdmin]

    def get_queryset(self):
        qs = Invoice.objects.select_related("student", "inscription")
        if _is_admin(self.request.user):
            return qs
        return qs.filter(student__user=self.request.user)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return InvoiceDetailSerializer
        return InvoiceSerializer


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsOwnerStudentOrAdmin]

    def get_queryset(self):
        qs = Payment.objects.select_related("invoice", "student", "payment_method", "receipt")
        if _is_admin(self.request.user):
            return qs
        return qs.filter(student__user=self.request.user)

    def get_serializer_class(self):
        return PaymentSerializer

    @action(detail=False, methods=["post"])
    def initiate(self, request):
        """Initie un paiement pour une facture. Pour Stripe/PayPal, le
        front doit avoir déjà créé l'intent/order côté passerelle et fournir
        sa référence ; la confirmation finale arrive ensuite via webhook.
        Pour espèces/virement, le paiement reste 'pending' jusqu'à
        confirmation manuelle par un admin (endpoint /confirm/)."""
        serializer = PaymentCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            method = PaymentMethod.objects.get(code=data.pop("payment_method_code"), is_active=True)
        except PaymentMethod.DoesNotExist:
            return Response({"detail": "Moyen de paiement invalide ou inactif."}, status=400)

        try:
            payment = PaymentService.initiate(
                invoice=data["invoice"],
                payment_method=method,
                amount=data["amount"],
                idempotency_key=data["idempotency_key"],
                user=request.user,
                gateway_reference=data.get("gateway_reference", ""),
            )
        except PaymentError as exc:
            return Response({"detail": str(exc)}, status=400)

        return Response(PaymentSerializer(payment).data, status=201)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOnly])
    def confirm(self, request, pk=None):
        """Confirmation manuelle — espèces reçues en personne, virement
        vérifié sur le relevé bancaire. Admin uniquement."""
        payment = self.get_object()
        try:
            payment = PaymentService.confirm_manual(payment, confirmed_by=request.user)
        except PaymentError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(PaymentSerializer(payment).data)


# ---------------------------------------------------------------------------
# Webhooks passerelles — non authentifiés (JWT n'a pas de sens pour un
# serveur tiers), sécurisés par vérification de signature à la place.
# ---------------------------------------------------------------------------

class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        import stripe

        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError):
            logger.warning("Signature Stripe invalide sur webhook reçu.")
            return Response(status=status.HTTP_400_BAD_REQUEST)

        PaymentService.handle_stripe_event(event)
        return Response(status=status.HTTP_200_OK)


class PayPalWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        # La vérification de signature PayPal se fait via leur endpoint
        # /v1/notifications/verify-webhook-signature (transmission_id, cert_url, etc.)
        # — appel omis ici, à implémenter avec les identifiants PayPal du projet.
        event = json.loads(request.body)
        PaymentService.handle_paypal_event(event)
        return Response(status=status.HTTP_200_OK)


class MobileMoneyWebhookView(APIView):
    """Point d'entrée générique — chaque fournisseur (Digicel, MonCash, MTN)
    a son propre format ; un adaptateur en amont doit normaliser la charge
    utile en {id, status, reference} avant d'appeler ce endpoint, ou bien
    ce endpoint doit être dupliqué/spécialisé par fournisseur."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        shared_secret = request.META.get("HTTP_X_WEBHOOK_SECRET", "")
        if shared_secret != settings.MOBILE_MONEY_WEBHOOK_SECRET:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        event = json.loads(request.body)
        PaymentService.handle_mobile_money_event(event)
        return Response(status=status.HTTP_200_OK)
