from rest_framework import serializers

from apps.enrollments.models import Inscription, InscriptionStatus


class InscriptionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.get_full_name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = Inscription
        fields = [
            "id", "local_uuid", "student", "course",
            "student_name", "course_name",
            "status", "rejection_reason",
            "requested_at", "approved_by", "approved_at",
            "activated_at", "validated_at",
            "synced", "created_offline",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "approved_by", "approved_at",
            "activated_at", "validated_at", "created_at", "updated_at",
        ]

class InscriptionCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur utilisé à la création, aussi bien online qu'offline.

    En mode offline, le client génère lui-même `local_uuid` et l'envoie ;
    ceci permet au Sync Manager de détecter un doublon si le même payload
    est rejoué deux fois (ex: reconnexion instable), plutôt que de créer
    deux inscriptions.
    """
    # Déclaration explicite : le modèle a editable=False sur ce champ,
    # ce qui rendrait le champ auto-généré read_only par DRF et empêcherait
    # le client d'envoyer local_uuid lors d'un replay offline.
    local_uuid = serializers.UUIDField(required=False)

    class Meta:
        model = Inscription
        fields = ["local_uuid", "student", "course", "requested_at", "created_offline"]

    def validate(self, attrs):
        local_uuid = attrs.get("local_uuid")

        if local_uuid and Inscription.objects.filter(local_uuid=local_uuid).exists():
            return attrs

        student = attrs["student"]
        course = attrs["course"]
        existing = Inscription.objects.filter(
            student=student,
            course=course,
            status__in=[
                InscriptionStatus.PENDING,
                InscriptionStatus.APPROVED,
                InscriptionStatus.ACTIVE,
                InscriptionStatus.SUSPENDED,
            ],
        )
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError(
                "Une inscription active existe déjà pour cet étudiant sur ce cours."
            )
        return attrs

    def create(self, validated_data):
        local_uuid = validated_data.get("local_uuid")
        if local_uuid:
            existing = Inscription.objects.filter(local_uuid=local_uuid).first()
            if existing:
                return existing
        return super().create(validated_data)

class InscriptionRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=False)


class InscriptionTransitionSerializer(serializers.Serializer):
    """Utilisé par l'action générique /transition/ pour activer, suspendre, valider..."""
    status = serializers.ChoiceField(choices=InscriptionStatus.choices)
