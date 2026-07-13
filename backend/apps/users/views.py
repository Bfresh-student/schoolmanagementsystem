from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Q
from .models import User, UserProfile, LoginLog, PasswordResetToken
from .serializers import (
    UserListSerializer, UserDetailSerializer, UserCreateSerializer,
    UserUpdateSerializer, UserPasswordChangeSerializer, LoginLogSerializer,
    UserRoleChangeSerializer, UserStatusChangeSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des utilisateurs
    
    Endpoints:
    - GET /api/v1/auth/users/ - Liste des utilisateurs
    - POST /api/v1/auth/users/ - Créer un utilisateur
    - GET /api/v1/auth/users/{id}/ - Détails d'un utilisateur
    - PUT/PATCH /api/v1/auth/users/{id}/ - Modifier un utilisateur
    - DELETE /api/v1/auth/users/{id}/ - Supprimer un utilisateur
    - POST /api/v1/auth/users/register/ - S'inscrire
    - POST /api/v1/auth/users/login/ - Se connecter
    - POST /api/v1/auth/users/logout/ - Se déconnecter
    - GET /api/v1/auth/users/me/ - Profil personnel
    - PATCH /api/v1/auth/users/me/update/ - Mettre à jour le profil
    - POST /api/v1/auth/users/me/change-password/ - Changer le mot de passe
    - GET /api/v1/auth/users/{id}/login-logs/ - Historique de connexion
    - POST /api/v1/auth/users/{id}/change-role/ - Changer le rôle
    - POST /api/v1/auth/users/{id}/change-status/ - Changer le statut
    """
    
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'register':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'retrieve':
            return UserDetailSerializer
        elif self.action == 'change_password':
            return UserPasswordChangeSerializer
        elif self.action == 'change_role':
            return UserRoleChangeSerializer
        elif self.action == 'change_status':
            return UserStatusChangeSerializer
        return UserListSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'register', 'login']:
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        """Filtrer les utilisateurs selon les paramètres de requête"""
        queryset = User.objects.all()
        
        # Filtrer par rôle
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filtrer par statut
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filtrer par actif/inactif
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Recherche par email ou nom
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Endpoint d'inscription"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.status = 'ACTIVE'
        user.save()
        
        return Response({
            'message': 'Utilisateur créé avec succès',
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Endpoint de connexion"""
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email et mot de passe requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = None

        if user is None or not user.check_password(password):
            # Logger la tentative échouée
            LoginLog.objects.create(
                user=None,
                ip_address=self.get_client_ip(request),
                is_successful=False,
                failure_reason='Identifiants invalides'
            )
            return Response(
                {'error': 'Identifiants invalides'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Compte désactivé'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Logger la connexion réussie
        user.last_login = timezone.now()
        user.save()

        LoginLog.objects.create(
            user=user,
            ip_address=self.get_client_ip(request),
            is_successful=True
        )

        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Connexion réussie',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Endpoint de déconnexion"""
        try:
            # Mettre à jour le dernier log de connexion
            login_log = LoginLog.objects.filter(
                user=request.user,
                logout_time__isnull=True
            ).latest('login_time')
            login_log.logout_time = timezone.now()
            login_log.save()
        except LoginLog.DoesNotExist:
            pass
        
        return Response(
            {'message': 'Déconnexion réussie'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtenir le profil personnel"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], url_path='me/update')
    def update_profile(self, request):
        """Mettre à jour le profil personnel"""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Profil mis à jour',
            'user': UserDetailSerializer(request.user).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], url_path='me/change-password')
    def change_password(self, request):
        """Changer le mot de passe"""
        serializer = UserPasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            {'message': 'Mot de passe modifié avec succès'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'], url_path='login-logs')
    def login_logs(self, request, pk=None):
        """Obtenir l'historique de connexion d'un utilisateur"""
        user = self.get_object()
        
        # Vérifier les permissions
        if request.user != user and not request.user.is_admin_user:
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'accéder à ces données'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        logs = LoginLog.objects.filter(user=user).order_by('-login_time')
        
        serializer = LoginLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='change-role')
    def change_role(self, request, pk=None):
        """Changer le rôle d'un utilisateur (Admin seulement)"""
        user = self.get_object()
        
        # Vérifier les permissions
        if not request.user.is_admin_user:
            return Response(
                {'error': 'Seuls les administrateurs peuvent changer les rôles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserRoleChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user.role = serializer.validated_data['role']
        user.save()
        
        return Response({
            'message': f'Rôle changé en {user.get_role_display()}',
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        """Changer le statut d'un utilisateur (Admin seulement)"""
        user = self.get_object()
        
        # Vérifier les permissions
        if not request.user.is_admin_user:
            return Response(
                {'error': 'Seuls les administrateurs peuvent changer les statuts'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserStatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user.status = serializer.validated_data['status']
        user.save()
        
        return Response({
            'message': f'Statut changé en {user.get_status_display()}',
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    @staticmethod
    def get_client_ip(request):
        """Obtenir l'IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip