from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Event, EventMedia, EventParticipant

User = get_user_model()


class EventParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = EventParticipant
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "registration_date",
            "status",
            "checked_in_at",
            "synced",
        ]
        read_only_fields = ["id", "registration_date", "synced"]


class EventMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventMedia
        fields = ["id", "media_file_id", "caption", "uploaded_by", "uploaded_at"]
        read_only_fields = ["id", "uploaded_by", "uploaded_at"]


class EventListSerializer(serializers.ModelSerializer):
    """Vue allégée — agenda / catalogue d'événements."""

    seats_available = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    confirmed_participants_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "name",
            "description",
            "event_type",
            "start_datetime",
            "end_datetime",
            "location",
            "is_online",
            "status",
            "capacity_max",
            "seats_available",
            "is_full",
            "confirmed_participants_count",
            "calendar_metadata",
            "created_at",
        ]


class EventDetailSerializer(serializers.ModelSerializer):
    """Vue complète — fiche événement (organisateur / admin)."""

    creator_name = serializers.CharField(source="creator.get_full_name", read_only=True)
    seats_available = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    confirmed_participants_count = serializers.IntegerField(read_only=True)
    participants = EventParticipantSerializer(many=True, read_only=True)
    media_items = EventMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "name",
            "description",
            "event_type",
            "start_datetime",
            "end_datetime",
            "location",
            "is_online",
            "online_link",
            "capacity_max",
            "seats_available",
            "is_full",
            "confirmed_participants_count",
            "status",
            "creator",
            "creator_name",
            "created_at",
            "updated_at",
            "calendar_metadata",
            "participants",
            "media_items",
        ]
        read_only_fields = ["id", "creator", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("start_datetime", getattr(self.instance, "start_datetime", None))
        end = attrs.get("end_datetime", getattr(self.instance, "end_datetime", None))
        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_datetime": "La date de fin doit être après la date de début."}
            )
        return attrs
