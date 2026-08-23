from django.db import transaction
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.events.models import Event, EventMedia, EventParticipant
from apps.events.permissions import CanViewPublishedEventOrManage, HasResourcePermission
from apps.events.serializers import (
    EventDetailSerializer,
    EventListSerializer,
    EventMediaSerializer,
    EventParticipantSerializer,
)


class EventViewSet(viewsets.ModelViewSet):
    """
    CRUD sur les événements + actions dédiées :
      - /events/{id}/register/       (s'inscrire)
      - /events/{id}/cancel/         (annuler son inscription)
      - /events/{id}/check-in/       (marquer un participant présent)
      - /events/{id}/media/          (ajouter une photo/vidéo)
      - /events/{id}/publish/
    """

    queryset = Event.objects.select_related("creator").prefetch_related(
        "participants", "media_items"
    )
    permission_classes = [
        IsAuthenticated,
        HasResourcePermission,
        CanViewPublishedEventOrManage,
    ]
    resource_name = "events"

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "location"]
    ordering_fields = ["start_datetime", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return EventListSerializer
        return EventDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_type = self.request.query_params.get("event_type")
        status_filter = self.request.query_params.get("status")
        if event_type:
            qs = qs.filter(event_type=event_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=["patch"], url_path="publish")
    def publish(self, request, pk=None):
        event = self.get_object()
        event.status = "published"
        event.save(update_fields=["status"])
        return Response(EventDetailSerializer(event).data)

    @action(detail=True, methods=["post"], url_path="register")
    def register(self, request, pk=None):
        """
        Inscrit l'utilisateur connecté à l'événement. Si la capacité
        max est atteinte, l'inscription passe en liste d'attente.
        """
        event = self.get_object()
        if event.status not in ("published", "ongoing"):
            return Response(
                {"detail": "Cet événement n'accepte pas d'inscriptions."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            event_locked = Event.objects.select_for_update().get(pk=event.pk)
            existing = EventParticipant.objects.filter(
                event=event_locked, user=request.user
            ).first()
            if existing and existing.status in ("registered", "attended", "waitlisted"):
                return Response(
                    {"detail": "Vous êtes déjà inscrit à cet événement."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            new_status = "waitlisted" if event_locked.is_full else "registered"
            if existing:
                existing.status = new_status
                existing.save(update_fields=["status"])
                participant = existing
            else:
                participant = EventParticipant.objects.create(
                    event=event_locked, user=request.user, status=new_status
                )

        self._notify(
            participant,
            "event_registration_waitlisted"
            if new_status == "waitlisted"
            else "event_registration_confirmed",
        )
        return Response(
            EventParticipantSerializer(participant).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """Annule sa propre inscription et promeut le premier de la liste d'attente."""
        event = self.get_object()
        with transaction.atomic():
            participant = EventParticipant.objects.select_for_update().filter(
                event=event, user=request.user
            ).first()
            if not participant or participant.status == "cancelled":
                return Response(
                    {"detail": "Aucune inscription active trouvée."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            was_confirmed = participant.status in ("registered", "attended")
            participant.status = "cancelled"
            participant.save(update_fields=["status"])

            promoted = None
            if was_confirmed:
                promoted = (
                    EventParticipant.objects.select_for_update()
                    .filter(event=event, status="waitlisted")
                    .order_by("registration_date")
                    .first()
                )
                if promoted:
                    promoted.status = "registered"
                    promoted.save(update_fields=["status"])

        if promoted:
            self._notify(promoted, "event_registration_confirmed")
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        """Marque un participant comme présent (utilisé à l'accueil de l'événement)."""
        event = self.get_object()
        user_id = request.data.get("user_id")
        participant = EventParticipant.objects.filter(event=event, user_id=user_id).first()
        if not participant:
            return Response(
                {"detail": "Participant non trouvé pour cet événement."},
                status=status.HTTP_404_NOT_FOUND,
            )
        participant.status = "attended"
        participant.checked_in_at = timezone.now()
        participant.save(update_fields=["status", "checked_in_at"])
        return Response(EventParticipantSerializer(participant).data)

    @action(detail=True, methods=["get", "post"], url_path="media")
    def media(self, request, pk=None):
        event = self.get_object()
        if request.method == "GET":
            serializer = EventMediaSerializer(event.media_items.all(), many=True)
            return Response(serializer.data)

        serializer = EventMediaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(event=event, uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _notify(participant: EventParticipant, trigger_type: str):
        try:
            from apps.notifications.services import enqueue_notification
        except ImportError:
            return
        enqueue_notification(
            recipient_id=participant.user_id,
            trigger_type=trigger_type,
            context={"event_name": participant.event.name},
        )
