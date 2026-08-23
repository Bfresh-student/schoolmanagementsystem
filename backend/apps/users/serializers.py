from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import User, UserProfile, LoginLog


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil utilisateur"""
    
    class Meta:
        model = UserProfile
        fields = [
            'date_of_birth', 'gender', 'nationality',
            'street_address', 'city', 'state', 'country', 'postal_code',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            'document_id', 'document_type'
        ]


class UserListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'status', 'is_active', 'date_joined', 'phone']
        read_only_fields = ['id', 'date_joined']


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour la vue complète"""
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    is_teacher = serializers.BooleanField(read_only=True)
    is_student = serializers.BooleanField(read_only=True)
    student_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'role', 'status', 'is_active', 'is_verified', 'avatar', 'bio', 'locale',
            'is_teacher', 'is_student', 'student_id', 'profile', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'is_verified', 'date_joined', 'last_login']

    def get_student_id(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.id
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'utilisateur.
    Pour les étudiants, l'email est optionnel — un email fictif est auto-généré
    si non fourni (les étudiants du CEJEC sont identifiés par nom + téléphone).
    """
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'role', 'password', 'password_confirm'
        ]

    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas'})

        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': e.messages})

        # Auto-generate email for students who don't have one
        if not data.get('email'):
            import uuid as _uuid
            first = (data.get('first_name') or '').lower().replace(' ', '')
            last = (data.get('last_name') or '').lower().replace(' ', '')
            phone = (data.get('phone') or '').replace('+', '').replace(' ', '')
            
            # Base du suffixe
            base_suffix = phone or str(_uuid.uuid4())[:8]
            email_candidate = f"{first}.{last}.{base_suffix}@cejec.auto"
            
            # Garantir l'unicité
            while User.objects.filter(email=email_candidate).exists():
                email_candidate = f"{first}.{last}.{base_suffix}.{str(_uuid.uuid4())[:4]}@cejec.auto"
                
            data['email'] = email_candidate

        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour mettre à jour l'utilisateur"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'avatar', 'bio', 'locale'
        ]


class UserPasswordChangeSerializer(serializers.Serializer):
    """Serializer pour changer le mot de passe"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mot de passe actuel incorrect')
        return value
    
    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.last_password_change = timezone.now()
        user.save()
        return user


class UserPasswordResetRequestSerializer(serializers.Serializer):
    """Serializer pour demander une réinitialisation de mot de passe"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Cet email n\'existe pas dans le système')
        return value


class UserPasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer pour confirmer la réinitialisation de mot de passe"""
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    
    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value


class LoginLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs de connexion"""
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = LoginLog
        fields = ['id', 'user', 'ip_address', 'login_time', 'logout_time', 'is_successful']
        read_only_fields = ['id', 'login_time']


class UserRoleChangeSerializer(serializers.Serializer):
    """Serializer pour changer le rôle d'un utilisateur"""
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)


class UserStatusChangeSerializer(serializers.Serializer):
    """Serializer pour changer le statut d'un utilisateur"""
    status = serializers.ChoiceField(choices=User.STATUS_CHOICES)
    reason = serializers.CharField(required=False, allow_blank=True)