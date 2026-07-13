from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.validators import URLValidator
from core.mixins import AuditableMixin


class UserManager(BaseUserManager):
    """Gestionnaire personnalisé pour le modèle User"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('L\'email est obligatoire')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser doit avoir is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser doit avoir is_superuser=True')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, AuditableMixin):
    """Modèle utilisateur personnalisé"""
    
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('DIRECTOR', 'Directeur'),
        ('TEACHER', 'Professeur'),
        ('STUDENT', 'Élève'),
        ('PARENT', 'Parent'),
        ('SECRETARY', 'Secrétaire'),
        ('ACCOUNTANT', 'Comptable'),
        ('STAFF', 'Personnel'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Actif'),
        ('INACTIVE', 'Inactif'),
        ('SUSPENDED', 'Suspendu'),
        ('PENDING', 'En attente'),
    ]
    
    # Identité
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    
    # Rôle et statut
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Compte
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Dates
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    last_password_change = models.DateTimeField(null=True, blank=True)
    
    # Métadonnées
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)
    locale = models.CharField(
        max_length=10, 
        default='fr', 
        choices=[('fr', 'Français'), ('ht', 'Créole'), ('en', 'English')]
    )
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users_user'
        ordering = ['-date_joined']
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name
    
    @property
    def is_teacher(self):
        return self.role == 'TEACHER'
    
    @property
    def is_student(self):
        return self.role == 'STUDENT'
    
    @property
    def is_parent(self):
        return self.role == 'PARENT'
    
    @property
    def is_admin_user(self):
        return self.role in ['ADMIN', 'DIRECTOR']


class UserProfile(AuditableMixin):
    """Profil étendu de l'utilisateur"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Infos personnelles
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10, 
        choices=[('M', 'Masculin'), ('F', 'Féminin')], 
        blank=True
    )
    nationality = models.CharField(max_length=100, blank=True)
    
    # Adresse
    street_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Contacts d'urgence
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)
    
    # Métadonnées
    document_id = models.CharField(max_length=50, blank=True, unique=True, null=True)
    document_type = models.CharField(max_length=50, blank=True)
    
    class Meta:
        db_table = 'users_profile'
        verbose_name = 'Profil utilisateur'
        verbose_name_plural = 'Profils utilisateurs'
    
    def __str__(self):
        return f"Profil de {self.user.get_full_name()}"


class LoginLog(models.Model):
    """Enregistrement des connexions pour l'audit"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_logs', null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_successful = models.BooleanField(default=True)
    failure_reason = models.CharField(max_length=255, blank=True)
    
    class Meta:
        db_table = 'users_login_log'
        ordering = ['-login_time']
        verbose_name = 'Log de connexion'
        verbose_name_plural = 'Logs de connexion'
        indexes = [
            models.Index(fields=['user', '-login_time']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else 'Anonyme'
        return f"{user_str} - {self.login_time}"


class PasswordResetToken(models.Model):
    """Tokens pour réinitialiser le mot de passe"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users_password_reset_token'
        ordering = ['-created_at']
        verbose_name = 'Token de réinitialisation'
        verbose_name_plural = 'Tokens de réinitialisation'
    
    def __str__(self):
        return f"Token de {self.user.email}"
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired