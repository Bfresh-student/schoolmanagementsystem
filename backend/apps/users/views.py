from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Q
from apps.students.models import Student
from .models import User, UserProfile, LoginLog, PasswordResetToken, SystemSetting
from .serializers import (
    UserListSerializer, UserDetailSerializer, UserCreateSerializer,
    UserUpdateSerializer, UserPasswordChangeSerializer, LoginLogSerializer,
    UserRoleChangeSerializer, UserStatusChangeSerializer
)


class IsAdministrator(BasePermission):
    """Réserve l'administration des comptes aux rôles d'administration."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_user)


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
        if self.action in ['register', 'login', 'refresh']:
            return [AllowAny()]
        if self.action in ['list', 'create', 'destroy', 'login_logs', 'change_role', 'change_status']:
            return [IsAdministrator()]
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
        
        if not self.request.user.is_admin_user:
            return queryset.filter(pk=self.request.user.pk)
        return queryset

    @action(detail=False, methods=['get', 'patch'], url_path='settings', permission_classes=[IsAdministrator])
    def institution_settings(self, request):
        """Lit ou enregistre la configuration globale de l'établissement."""
        setting, _ = SystemSetting.objects.get_or_create(key="institution")
        if request.method == 'GET':
            return Response({"settings": setting.value, "updated_at": setting.updated_at})

        payload = request.data.get("settings")
        if not isinstance(payload, dict):
            return Response(
                {"detail": "Le champ settings doit être un objet JSON."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        setting.value = payload
        setting.updated_by = request.user
        setting.save(update_fields=["value", "updated_by", "updated_at"])
        return Response({"settings": setting.value, "updated_at": setting.updated_at})

    @action(detail=False, methods=['get'], url_path='global-search', permission_classes=[IsAdministrator])
    def global_search(self, request):
        """Recherche unifiée, limitée aux données visibles par l'administration."""
        query = (request.query_params.get("q") or "").strip()
        if len(query) < 2:
            return Response({"results": []})

        from apps.courses.models import Course
        from apps.events.models import Event
        from apps.hr.models import Employee
        from apps.students.models import Student
        from apps.teachers.models import Teacher

        limit = 5
        results = []
        students = Student.objects.select_related("user").filter(
            Q(user__first_name__icontains=query)
            | Q(user__last_name__icontains=query)
            | Q(user__email__icontains=query)
            | Q(registration_number__icontains=query)
        )[:limit]
        results.extend({
            "type": "Étudiant", "id": student.id,
            "title": student.user.get_full_name() or student.user.email,
            "subtitle": student.registration_number,
            "href": "gestion_inscriptions.html",
        } for student in students)

        teachers = Teacher.objects.select_related("user").filter(
            Q(user__first_name__icontains=query)
            | Q(user__last_name__icontains=query)
            | Q(user__email__icontains=query)
            | Q(teacher_id__icontains=query)
        )[:limit]
        results.extend({
            "type": "Professeur", "id": str(teacher.id),
            "title": teacher.full_name or teacher.email,
            "subtitle": teacher.teacher_id,
            "href": "rh.html",
        } for teacher in teachers)

        employees = Employee.objects.filter(
            Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
            | Q(email__icontains=query)
            | Q(employee_number__icontains=query)
            | Q(job_title__icontains=query)
        )[:limit]
        results.extend({
            "type": "Employé", "id": employee.id,
            "title": f"{employee.first_name} {employee.last_name}",
            "subtitle": f"{employee.employee_number} · {employee.job_title}",
            "href": "rh.html",
        } for employee in employees)

        courses = Course.objects.filter(
            Q(name__icontains=query) | Q(code__icontains=query)
        )[:limit]
        results.extend({
            "type": "Formation", "id": str(course.id),
            "title": course.name,
            "subtitle": course.code,
            "href": "gestion_classes.html",
        } for course in courses)

        events = Event.objects.filter(
            Q(name__icontains=query) | Q(location__icontains=query)
        )[:limit]
        results.extend({
            "type": "Événement", "id": str(event.id),
            "title": event.name,
            "subtitle": event.location or event.start_datetime.strftime("%d/%m/%Y %H:%M"),
            "href": "incubateur_calendrier.html",
        } for event in events)
        return Response({"results": results[:25]})
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Endpoint d'inscription avec déduplication des étudiants."""
        role = request.data.get("role", "STUDENT")
        phone = (request.data.get("phone") or "").strip()
        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()

        if role != "STUDENT" and (
            not request.user.is_authenticated or not request.user.is_admin_user
        ):
            return Response(
                {"detail": "Seul un administrateur peut créer ce type de compte."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = None
        if role == "STUDENT" and phone and first_name and last_name:
            user = User.objects.filter(
                role="STUDENT", phone=phone,
                first_name__iexact=first_name,
                last_name__iexact=last_name,
            ).first()
        # Contrôle d'autorisation déplacé avant la déduplication.
        #
        #
        #

        #
        #
        #

        # SECURITY FIX: never issue tokens for an existing account without
        # verifying the password. Return 400 so the caller can direct the
        # user to the login screen instead.
        if user is not None:
            return Response(
                {"detail": "Un compte existe déjà avec ces informations. Veuillez vous connecter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.status = "ACTIVE"
        user.save(update_fields=["status"])

        if user.role == "STUDENT":
            Student.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Utilisateur créé avec succès",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserDetailSerializer(user).data,
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
            # L'utilisateur peut se connecter avec son email ou son téléphone
            user = User.objects.filter(Q(email=email) | Q(phone=email)).first()
            if not user:
                user = None
        except Exception:
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

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def refresh(self, request):
        """Endpoint pour rafraîchir le token d'accès JWT"""
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Token refresh requis'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token)
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Token invalide ou expiré'}, status=status.HTTP_401_UNAUTHORIZED)
    
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

        # Créer le profil Student si le nouveau rôle est STUDENT
        if user.role == "STUDENT":
            Student.objects.get_or_create(user=user)

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
