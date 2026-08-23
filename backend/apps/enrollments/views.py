import logging

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.students.models import Student, SchoolClass
from apps.enrollments.models import Inscription, InscriptionStatus, PreInscription, PreInscriptionStatus
from apps.enrollments.permissions import InscriptionPermission
from apps.enrollments.serializers import (
    InscriptionCreateSerializer,
    InscriptionRejectSerializer,
    InscriptionSerializer,
    InscriptionTransitionSerializer,
    PreInscriptionSerializer,
)

logger = logging.getLogger(__name__)


class InscriptionViewSet(viewsets.ModelViewSet):
    resource_name = "inscriptions"
    """
    Endpoints :
      GET    /inscriptions/                 -> liste (filtrée par rôle)
      POST   /inscriptions/                 -> créer (online ou offline)
      GET    /inscriptions/{id}/            -> détail
      POST   /inscriptions/{id}/approve/    -> pending -> approved
      POST   /inscriptions/{id}/reject/     -> pending|approved -> rejected
      POST   /inscriptions/{id}/transition/ -> transition générique (activate, suspend, validate)
      POST   /inscriptions/sync_batch/      -> traite un lot d'inscriptions saisies offline
    """
    queryset = Inscription.objects.select_related(
        "student__user",
        "school_class__specialization",
        "course",
        "approved_by",
        # AJOUTÉ : InscriptionSerializer expose maintenant amount_paid /
        # balance_due / invoice_id / invoice_status calculés depuis la
        # facture liée (obj.invoice — OneToOneField related_name="invoice",
        # voir apps/finance/models.py). select_related() fait un simple
        # JOIN SQL ; sans lui, chacun de ces 4 champs déclenche une requête
        # séparée par inscription lors d'un GET liste -> N+1 queries.
        "invoice",
    ).all()
    permission_classes = [InscriptionPermission]

    def get_serializer_class(self):
        if self.action == "create":
            return InscriptionCreateSerializer
        if self.action == "reject":
            return InscriptionRejectSerializer
        if self.action == "transition":
            return InscriptionTransitionSerializer
        return InscriptionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role_name = getattr(user, "role", None)

        if role_name == "STUDENT":
            return qs.filter(student__user=user)
        if role_name == "TEACHER":
            return qs.filter(school_class__specialization__courses__teacher__user=user).distinct()
        if role_name in ("ADMIN", "DIRECTOR", "SECRETARY", "ACCOUNTANT"):
            return qs

        return qs.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inscription = serializer.save(
            synced=not serializer.validated_data.get("created_offline", False)
        )
        out = InscriptionSerializer(inscription)
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        inscription = self.get_object()
        try:
            inscription.transition_to(InscriptionStatus.APPROVED, actor=request.user)
        except DjangoValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InscriptionSerializer(inscription).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        inscription = self.get_object()
        serializer = InscriptionRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            inscription.transition_to(
                InscriptionStatus.REJECTED,
                actor=request.user,
                reason=serializer.validated_data["reason"],
            )
        except DjangoValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InscriptionSerializer(inscription).data)

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        """Transition générique : approved->active, active->suspended, ->validated, etc."""
        inscription = self.get_object()
        serializer = InscriptionTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            inscription.transition_to(serializer.validated_data["status"], actor=request.user)
        except DjangoValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InscriptionSerializer(inscription).data)

    @action(detail=False, methods=["post"])
    def sync_batch(self, request):
        """
        Reçoit un lot d'inscriptions saisies offline par un admin.
        Payload : { "items": [{"local_uuid": ..., "student": 1, "school_class": 3, ...}] }
        """
        items = request.data.get("items", [])
        if not request.user.is_admin_user:
            return Response(
                {"detail": "Seul un administrateur peut synchroniser des inscriptions pour plusieurs étudiants."},
                status=status.HTTP_403_FORBIDDEN,
            )

        results = []
        for item in items:
            serializer = InscriptionCreateSerializer(data=item, context={"request": request})
            if not serializer.is_valid():
                results.append({
                    "local_uuid": item.get("local_uuid"),
                    "status": "error",
                    "errors": serializer.errors,
                })
                continue
            inscription = serializer.save(synced=True)
            results.append({
                "local_uuid": str(inscription.local_uuid),
                "id": inscription.id,
                "status": "synced",
            })
        return Response({"results": results}, status=status.HTTP_200_OK)


class PreInscriptionView(APIView):
    """
    POST /api/v1/enrollments/pre-inscription/

    Endpoint public (AllowAny) pour le formulaire d'admission du site vitrine.
    Aucun compte n'est requis. Les champs correspondent exactement au formulaire
    HTML de etudes.html. Un numéro de dossier (reference) est renvoyé dans
    la réponse 201 pour confirmation.
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # pas de JWT, pas de session

    def post(self, request):
        serializer = PreInscriptionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        pre = serializer.save()
        logger.info("Nouvelle pré-inscription reçue : %s — %s %s", pre.reference, pre.prenom, pre.nom)
        return Response(
            {
                "reference": pre.reference,
                "message": (
                    f"Votre demande d'inscription a été reçue avec succès. "
                    f"Votre numéro de dossier est {pre.reference}. "
                    "Nous vous contacterons sous 24 à 48 heures."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class PreInscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des pré-inscriptions côté admin dashboard.
    """
    queryset = PreInscription.objects.all().order_by("-created_at")
    serializer_class = PreInscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().exclude(status=PreInscriptionStatus.CONVERTED)
        if not self.request.user.is_admin_user and self.request.user.role != "SECRETARY":
            return qs.none()
        return qs

    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):
        pre = self.get_object()
        if pre.status == PreInscriptionStatus.CONVERTED:
            return Response({"detail": "Cette pré-inscription est déjà convertie."}, status=status.HTTP_400_BAD_REQUEST)
            
        User = get_user_model()
        email = pre.email or f"{pre.reference.lower()}@cejec.local"
        
        try:
            with transaction.atomic():
                # 1. Création du compte utilisateur
                user = User.objects.create_user(
                    email=email,
                    password="ceject2026!",
                    first_name=pre.prenom,
                    last_name=pre.nom,
                    phone=pre.telephone,
                    role="STUDENT"
                )
                
                # 2. Création du profil étudiant
                address_parts = [pre.adresse, pre.commune, pre.departement]
                full_address = ", ".join([p for p in address_parts if p]).strip()
                
                student = Student.objects.create(
                    user=user,
                    date_of_birth=pre.date_naissance,
                    address=full_address,
                )
                
                # 3. Création de l'inscription (si classe fournie)
                inscription = None
                class_id = request.data.get('class_id')
                if class_id:
                    try:
                        school_class = SchoolClass.objects.get(pk=class_id)
                        inscription = Inscription.objects.create(
                            student=student,
                            school_class=school_class,
                            status=InscriptionStatus.APPROVED,
                            approved_by=request.user if request.user.is_authenticated else None,
                        )
                    except SchoolClass.DoesNotExist:
                        logger.warning(f"Classe {class_id} non trouvée lors de la conversion de pré‑inscription {pre.id}")
                
                # 4. Marquer comme convertie
                pre.status = PreInscriptionStatus.CONVERTED
                pre.save(update_fields=["status"])
                
                return Response({
                    "detail": "Convertie avec succès",
                    "student_id": student.id,
                    "user_id": user.id,
                    "registration_number": student.registration_number,
                    "inscription_id": inscription.id if inscription else None,
                })
        except Exception as e:
            logger.exception("Erreur lors de la conversion de pré-inscription")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)