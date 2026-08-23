import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Invoice, Payment, PaymentMethod
from .permissions import IsAdminOnly, IsOwnerStudentOrAdmin, ReadOnlyOrAdmin, _is_admin
from .serializers import (
    InvoiceDetailSerializer,
    InvoiceSerializer,
    PaymentCreateSerializer,
    PaymentMethodSerializer,
    PaymentSerializer,
)
from .services import InvoiceService, PaymentError, PaymentService

logger = logging.getLogger(__name__)

# ⚠️ CORRIGÉ : _is_admin n'est plus redéfinie ici. L'ancienne copie locale
# était identique (bug pour bug) à celle de permissions.py — avoir deux
# définitions de la même règle est ce qui a rendu ce bug difficile à
# repérer. Une seule source de vérité désormais : permissions._is_admin.


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
        from apps.enrollments.models import Inscription, InscriptionStatus
        missing = Inscription.objects.select_related("school_class", "course").filter(status__in=[InscriptionStatus.PENDING, InscriptionStatus.APPROVED, InscriptionStatus.ACTIVE, InscriptionStatus.SUSPENDED], invoice__isnull=True)
        student_id = self.request.query_params.get("student")
        if student_id:
            missing = missing.filter(student_id=student_id)
        for inscription in missing:
            amount = inscription.school_class.tuition_fee if inscription.school_class_id else None
            if amount is None and inscription.course_id:
                amount = inscription.course.fees_amount
            if amount is not None:
                InvoiceService.create_for_inscription(inscription, amount=amount)

        qs = Invoice.objects.select_related("student", "inscription")
        
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
            
        if _is_admin(self.request.user):
            return qs
        return qs.filter(student__user=self.request.user)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return InvoiceDetailSerializer
        return InvoiceSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ⚠️ CHANGEMENT : n'est plus en lecture seule. Le système ne gère aucun
    paiement en ligne ni webhook — un paiement est créé et complété en un
    seul appel `POST /finance/payments/` (espèces/virement/mobile money
    saisis en personne par le staff, confirmés sur place).

    Pas de PUT/PATCH/DELETE : un paiement enregistré ne se modifie pas
    (intégrité comptable) — pour corriger une erreur de saisie, utiliser
    l'action `void` ci-dessous plutôt que d'éditer l'enregistrement.
    """

    http_method_names = ["get", "post", "head", "options"]
    permission_classes = [IsOwnerStudentOrAdmin]

    def get_queryset(self):
        # Les anciennes versions créaient un paiement à 0 HTG : ce n'est pas
        # une transaction et il ne doit pas apparaître dans l'historique.
        qs = Payment.objects.filter(amount__gt=0).select_related(
            "invoice", "student", "payment_method", "receipt", "initiated_by"
        )
        if _is_admin(self.request.user):
            return qs
        return qs.filter(student__user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_permissions(self):
        # Seul le staff (admin/secrétariat via _is_admin) encaisse un
        # paiement — un étudiant ne peut que consulter les siens.
        if self.action in ("create", "void"):
            return [IsAdminOnly()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            payment = PaymentService.record_manual(
                invoice=data["invoice"],
                payment_method=data["payment_method"],
                amount=data["amount"],
                user=request.user,
            )
        except PaymentError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def void(self, request, pk=None):
        """Annule un paiement saisi par erreur. Admin uniquement (voir get_permissions)."""
        payment = self.get_object()
        reason = request.data.get("reason", "")
        try:
            payment = PaymentService.void(payment, voided_by=request.user, reason=reason)
        except PaymentError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(PaymentSerializer(payment).data)

