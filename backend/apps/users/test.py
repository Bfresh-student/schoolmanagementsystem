import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta

from apps.users.models import UserProfile, LoginLog, PasswordResetToken

User = get_user_model()


@pytest.fixture
def api_client():
    """Fixture pour le client API"""
    return APIClient()


@pytest.fixture
def user(db):
    """Fixture pour créer un utilisateur normal"""
    return User.objects.create_user(
        email='testuser@example.com',
        first_name='Test',
        last_name='User',
        password='TestPassword123!',
        role='STUDENT',
        status='ACTIVE'
    )


@pytest.fixture
def teacher(db):
    """Fixture pour créer un utilisateur professeur"""
    return User.objects.create_user(
        email='teacher@example.com',
        first_name='Jean',
        last_name='Dupont',
        password='TeacherPassword123!',
        role='TEACHER',
        status='ACTIVE'
    )


@pytest.fixture
def admin_user(db):
    """Fixture pour créer un administrateur"""
    return User.objects.create_superuser(
        email='admin@example.com',
        first_name='Admin',
        last_name='User',
        password='AdminPassword123!'
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """Client authentifié avec un utilisateur normal"""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Client authentifié avec un administrateur"""
    api_client.force_authenticate(user=admin_user)
    return api_client


# ========== TESTS INSCRIPTION ==========

@pytest.mark.django_db
class TestUserRegistration:
    """Tests pour l'inscription"""
    
    def test_register_success(self, api_client):
        """Test inscription réussie"""
        data = {
            'email': 'newuser@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'role': 'STUDENT'
        }
        response = api_client.post('/api/v1/auth/users/register/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='newuser@example.com').exists()
        assert response.data['user']['email'] == 'newuser@example.com'
    
    def test_register_password_mismatch(self, api_client):
        """Test inscription avec mots de passe différents"""
        data = {
            'email': 'newuser@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'SecurePassword123!',
            'password_confirm': 'DifferentPassword123!',
            'role': 'STUDENT'
        }
        response = api_client.post('/api/v1/auth/users/register/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_weak_password(self, api_client):
        """Test inscription avec mot de passe faible"""
        data = {
            'email': 'newuser@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'weak',
            'password_confirm': 'weak',
            'role': 'STUDENT'
        }
        response = api_client.post('/api/v1/auth/users/register/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_duplicate_email(self, api_client, user):
        """Test inscription avec email déjà existant"""
        data = {
            'email': user.email,
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'role': 'STUDENT'
        }
        response = api_client.post('/api/v1/auth/users/register/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_missing_required_fields(self, api_client):
        """Test inscription sans champs obligatoires"""
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
        }
        response = api_client.post('/api/v1/auth/users/register/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ========== TESTS CONNEXION ==========

@pytest.mark.django_db
class TestUserLogin:
    """Tests pour la connexion"""
    
    def test_login_success(self, api_client, user):
        """Test connexion réussie"""
        data = {
            'email': user.email,
            'password': 'TestPassword123!'
        }
        response = api_client.post('/api/v1/auth/users/login/', data)
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == user.email
    
    def test_login_invalid_email(self, api_client):
        """Test connexion avec email invalide"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'TestPassword123!'
        }
        response = api_client.post('/api/v1/auth/users/login/', data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_wrong_password(self, api_client, user):
        """Test connexion avec mauvais mot de passe"""
        data = {
            'email': user.email,
            'password': 'WrongPassword123!'
        }
        response = api_client.post('/api/v1/auth/users/login/', data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_missing_credentials(self, api_client):
        """Test connexion sans identifiants"""
        data = {}
        response = api_client.post('/api/v1/auth/users/login/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_inactive_account(self, api_client, user):
        """Test connexion avec compte désactivé"""
        user.is_active = False
        user.save()
        data = {
            'email': user.email,
            'password': 'TestPassword123!'
        }
        response = api_client.post('/api/v1/auth/users/login/', data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_login_logs_connection(self, api_client, user):
        """Test que la connexion est enregistrée dans les logs"""
        data = {
            'email': user.email,
            'password': 'TestPassword123!'
        }
        response = api_client.post('/api/v1/auth/users/login/', data)
        assert response.status_code == status.HTTP_200_OK
        
        # Vérifier que le log existe
        log = LoginLog.objects.filter(user=user, is_successful=True).first()
        assert log is not None
        assert log.ip_address is not None


# ========== TESTS PROFIL PERSONNEL ==========

@pytest.mark.django_db
class TestUserProfile:
    """Tests pour le profil utilisateur"""
    
    def test_get_profile(self, authenticated_client, user):
        """Test récupérer le profil personnel"""
        response = authenticated_client.get('/api/v1/auth/users/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
        assert response.data['first_name'] == user.first_name
    
    def test_get_profile_not_authenticated(self, api_client):
        """Test accès au profil sans authentification"""
        response = api_client.get('/api/v1/auth/users/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_profile(self, authenticated_client, user):
        """Test mise à jour du profil"""
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone': '+509XXXXXXXX',
            'bio': 'Nouvelle biographie'
        }
        response = authenticated_client.patch('/api/v1/auth/users/me/update/', data)
        assert response.status_code == status.HTTP_200_OK
        
        # Vérifier les modifications
        user.refresh_from_db()
        assert user.first_name == 'Updated'
        assert user.last_name == 'Name'
        assert user.phone == '+509XXXXXXXX'
    
    def test_update_locale(self, authenticated_client, user):
        """Test mise à jour de la locale"""
        data = {'locale': 'ht'}
        response = authenticated_client.patch('/api/v1/auth/users/me/update/', data)
        assert response.status_code == status.HTTP_200_OK
        
        user.refresh_from_db()
        assert user.locale == 'ht'


# ========== TESTS GESTION MOT DE PASSE ==========

@pytest.mark.django_db
class TestPasswordManagement:
    """Tests pour la gestion du mot de passe"""
    
    def test_change_password_success(self, authenticated_client, user):
        """Test changement de mot de passe réussi"""
        data = {
            'old_password': 'TestPassword123!',
            'new_password': 'NewPassword456!'
        }
        response = authenticated_client.post('/api/v1/auth/users/me/change-password/', data)
        assert response.status_code == status.HTTP_200_OK
        
        # Vérifier que le mot de passe a changé
        user.refresh_from_db()
        assert user.check_password('NewPassword456!')
        assert not user.check_password('TestPassword123!')
    
    def test_change_password_wrong_old_password(self, authenticated_client):
        """Test changement avec mauvais ancien mot de passe"""
        data = {
            'old_password': 'WrongPassword123!',
            'new_password': 'NewPassword456!'
        }
        response = authenticated_client.post('/api/v1/auth/users/me/change-password/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_change_password_weak_password(self, authenticated_client):
        """Test changement avec nouveau mot de passe faible"""
        data = {
            'old_password': 'TestPassword123!',
            'new_password': 'weak'
        }
        response = authenticated_client.post('/api/v1/auth/users/me/change-password/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ========== TESTS GESTION UTILISATEURS ==========

@pytest.mark.django_db
class TestUserManagement:
    """Tests pour la gestion des utilisateurs"""
    
    def test_list_users(self, authenticated_client):
        """Test lister les utilisateurs"""
        response = authenticated_client.get('/api/v1/auth/users/')
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data or isinstance(response.data, list)
    
    def test_get_user_detail(self, authenticated_client, user):
        """Test obtenir les détails d'un utilisateur"""
        response = authenticated_client.get(f'/api/v1/auth/users/{user.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
    
    def test_create_user_as_admin(self, admin_client):
        """Test créer un utilisateur en tant qu'admin"""
        data = {
            'email': 'newadmin@example.com',
            'first_name': 'New',
            'last_name': 'Admin',
            'password': 'NewAdminPassword123!',
            'password_confirm': 'NewAdminPassword123!',
            'role': 'TEACHER'
        }
        response = admin_client.post('/api/v1/auth/users/', data)
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_delete_user(self, admin_client, user):
        """Test supprimer un utilisateur"""
        response = admin_client.delete(f'/api/v1/auth/users/{user.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(id=user.id).exists()
    
    def test_filter_users_by_role(self, authenticated_client, teacher):
        """Test filtrer les utilisateurs par rôle"""
        response = authenticated_client.get('/api/v1/auth/users/?role=TEACHER')
        assert response.status_code == status.HTTP_200_OK
    
    def test_search_users(self, authenticated_client, user):
        """Test rechercher les utilisateurs"""
        response = authenticated_client.get(f'/api/v1/auth/users/?search={user.email}')
        assert response.status_code == status.HTTP_200_OK
    
    def test_change_user_role(self, admin_client, user):
        """Test changer le rôle d'un utilisateur"""
        data = {'role': 'TEACHER'}
        response = admin_client.post(f'/api/v1/auth/users/{user.id}/change-role/', data)
        assert response.status_code == status.HTTP_200_OK
        
        user.refresh_from_db()
        assert user.role == 'TEACHER'
    
    def test_change_user_status(self, admin_client, user):
        """Test changer le statut d'un utilisateur"""
        data = {'status': 'SUSPENDED'}
        response = admin_client.post(f'/api/v1/auth/users/{user.id}/change-status/', data)
        assert response.status_code == status.HTTP_200_OK
        
        user.refresh_from_db()
        assert user.status == 'SUSPENDED'


# ========== TESTS LOGS DE CONNEXION ==========

@pytest.mark.django_db
class TestLoginLogs:
    """Tests pour les logs de connexion"""
    
    def test_get_own_login_logs(self, authenticated_client, user):
        """Test obtenir ses propres logs de connexion"""
        # Créer quelques logs
        for i in range(3):
            LoginLog.objects.create(
                user=user,
                ip_address='127.0.0.1',
                is_successful=True
            )
        
        response = authenticated_client.get(f'/api/v1/auth/users/{user.id}/login-logs/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
    
    def test_cannot_access_other_login_logs(self, authenticated_client, user, admin_user):
        """Test qu'on ne peut pas accéder aux logs des autres utilisateurs"""
        response = authenticated_client.get(f'/api/v1/auth/users/{admin_user.id}/login-logs/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_can_access_any_login_logs(self, admin_client, user):
        """Test que l'admin peut accéder aux logs de n'importe quel utilisateur"""
        LoginLog.objects.create(
            user=user,
            ip_address='127.0.0.1',
            is_successful=True
        )
        
        response = admin_client.get(f'/api/v1/auth/users/{user.id}/login-logs/')
        assert response.status_code == status.HTTP_200_OK


# ========== TESTS MODÈLES ==========

@pytest.mark.django_db
class TestUserModel:
    """Tests pour le modèle User"""
    
    def test_user_creation(self, user):
        """Test création d'un utilisateur"""
        assert user.email == 'testuser@example.com'
        assert user.first_name == 'Test'
        assert user.last_name == 'User'
        assert user.check_password('TestPassword123!')
    
    def test_user_full_name(self, user):
        """Test la méthode get_full_name"""
        assert user.get_full_name() == 'Test User'
    
    def test_user_short_name(self, user):
        """Test la méthode get_short_name"""
        assert user.get_short_name() == 'Test'
    
    def test_user_is_student(self, user):
        """Test la propriété is_student"""
        assert user.is_student
        assert not user.is_teacher
    
    def test_user_is_teacher(self, teacher):
        """Test la propriété is_teacher"""
        assert teacher.is_teacher
        assert not teacher.is_student
    
    def test_user_is_admin(self, admin_user):
        """Test la propriété is_admin_user"""
        assert admin_user.is_admin_user


@pytest.mark.django_db
class TestUserProfileModel:
    """Tests pour le modèle UserProfile"""
    
    def test_profile_auto_creation(self, user):
        """Test que le profil est créé automatiquement"""
        assert hasattr(user, 'profile')
        assert UserProfile.objects.filter(user=user).exists()
    
    def test_profile_update(self, user):
        """Test mise à jour du profil"""
        profile = user.profile
        profile.date_of_birth = timezone.now().date()
        profile.gender = 'M'
        profile.city = 'Port-au-Prince'
        profile.save()
        
        user.profile.refresh_from_db()
        assert user.profile.city == 'Port-au-Prince'


# ========== TESTS DÉCONNEXION ==========

@pytest.mark.django_db
class TestLogout:
    """Tests pour la déconnexion"""
    
    def test_logout_success(self, authenticated_client, user):
        """Test déconnexion réussie"""
        response = authenticated_client.post('/api/v1/auth/users/logout/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_logout_not_authenticated(self, api_client):
        """Test déconnexion sans authentification"""
        response = api_client.post('/api/v1/auth/users/logout/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED