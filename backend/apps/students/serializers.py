from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Specialization, Student
from .models import SchoolClass

User = get_user_model()

 
 
class SchoolClassSerializer(serializers.ModelSerializer):
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)
    student_count = serializers.IntegerField(source='students.count', read_only=True)
 
    class Meta:
        model = SchoolClass
        fields = [
            'id', 'name', 'specialization', 'specialization_name',
            'level', 'room', 'capacity', 'tuition_fee', 'is_active', 'student_count',
        ]
        read_only_fields = ['name']  # généré automatiquement par le modèle


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ["id", "name", "description", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class EmergencyContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    relationship = serializers.CharField(max_length=50, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30)


class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer complet — réservé aux rôles Admin/Teacher (voir permissions).
    Expose les champs sensibles (naissance, adresse, contacts).
    """

    emergency_contacts = EmergencyContactSerializer(many=True, required=False)
    full_name = serializers.SerializerMethodField()
    specialization_name = serializers.CharField(
        source="specialization.name", read_only=True, default=None
    )

    school_class_name = serializers.CharField(
        source="school_class.name", read_only=True, default=None
    )

    class Meta:
        model = Student
        fields = [
            "id", "user", "full_name", "registration_number",
            "specialization", "specialization_name",
            "school_class", "school_class_name",   # <-- à ajouter
            "date_of_birth", "address", "emergency_contacts",
            "enrollment_date", "status", "is_active",
            "synced", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "registration_number", "enrollment_date",
            "synced", "created_at", "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class StudentPublicSerializer(serializers.ModelSerializer):
    """
    Version restreinte — pour un étudiant qui consulte son propre profil,
    ou pour des listes publiques (pas de données sensibles).
    """

    full_name = serializers.SerializerMethodField()
    specialization_name = serializers.CharField(
        source="specialization.name", read_only=True, default=None
    )

    class Meta:
        model = Student
        fields = [
            "id", "full_name", "registration_number",
            "specialization_name", "status", "enrollment_date",
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class StudentCreateSerializer(serializers.ModelSerializer):
    """
    Création d'un profil étudiant à partir d'un USER existant
    (ex: après inscription approuvée — voir app Inscription).
    """
    school_class_name = serializers.CharField(
        source="school_class.name", read_only=True, default=None
    )

    class Meta:
        model = Student
        fields = [
            "user", "specialization", "date_of_birth",
            "address", "emergency_contacts", "school_class_name",
        ]

    def validate_user(self, user):
        if Student.objects.filter(user=user).exists():
            raise serializers.ValidationError(
                "Cet utilisateur possède déjà un profil étudiant."
            )
        return user