import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta, date, time

from apps.teachers.models import (
    Teacher, TeacherQualification, TeacherSpecialty, TeacherSchedule,
    TeacherAttendance, TeacherPerformanceReview, TeacherLeaveRequest,
    TeacherCertification
)

User = get_user_model()

# Configuration pytest
pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Créer un utilisateur admin (pas professeur)"""
    return User.objects.create_user(
        email='admin@example.com',
        first_name='Admin',
        last_name='User',
        password='AdminPassword123!',
        role='ADMIN',
        status='ACTIVE'
    )


@pytest.fixture
def teacher_user(db):
    """Créer un utilisateur avec role TEACHER
    
    NOTE: Le signal crée automatiquement un Teacher profile
    """
    return User.objects.create_user(
        email='teacher@example.com',
        first_name='Jean',
        last_name='Dupont',
        password='TeacherPassword123!',
        role='TEACHER',
        status='ACTIVE'
    )


@pytest.fixture
def teacher(teacher_user):
    """Obtenir le Teacher profile créé automatiquement par le signal"""
    # Le signal crée automatiquement le Teacher, pas besoin de le créer manuellement
    return teacher_user.teacher_profile


@pytest.fixture
def authenticated_client(api_client, admin_user):
    """Client authentifié avec utilisateur admin"""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def teacher_authenticated_client(api_client, teacher_user):
    """Client authentifié avec utilisateur professeur"""
    api_client.force_authenticate(user=teacher_user)
    return api_client


# ========== TESTS CRÉATION PROFESSEUR ==========

class TestTeacherCreation:
    """Tests pour la création de professeur"""
    
    def test_teacher_auto_created_on_user_creation(self, db):
        """Test: Teacher est créé automatiquement quand on crée un User TEACHER"""
        user = User.objects.create_user(
            email='newteacher@example.com',
            first_name='Test',
            last_name='Teacher',
            password='TestPassword123!',
            role='TEACHER',
            status='ACTIVE'
        )
        
        # Le signal devrait avoir créé un Teacher
        assert hasattr(user, 'teacher_profile')
        assert user.teacher_profile.teacher_id is not None
        assert user.teacher_profile.status == 'ACTIVE'
    
    def test_teacher_id_format(self, teacher):
        """Test: teacher_id est au bon format (T0001, T0002, etc)"""
        assert teacher.teacher_id.startswith('T')
        assert len(teacher.teacher_id) >= 4


# ========== TESTS LISTE PROFESSEURS ==========

class TestTeacherList:
    """Tests pour lister les professeurs"""
    
    def test_list_teachers(self, authenticated_client, teacher):
        """Test lister les professeurs"""
        response = authenticated_client.get('/api/v1/teachers/')
        assert response.status_code == status.HTTP_200_OK
        # La réponse peut être paginée
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) > 0
        else:
            assert len(response.data) > 0
    
    def test_filter_teachers_by_status(self, authenticated_client, teacher):
        """Test filtrer par statut"""
        response = authenticated_client.get('/api/v1/teachers/?status=ACTIVE')
        assert response.status_code == status.HTTP_200_OK
    
    def test_search_teachers(self, authenticated_client, teacher):
        """Test rechercher des professeurs"""
        response = authenticated_client.get('/api/v1/teachers/?search=Jean')
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_by_subject(self, authenticated_client, teacher):
        """Test filtrer par matière"""
        TeacherSpecialty.objects.create(
            teacher=teacher,
            subject='Mathématiques',
            level='SECONDARY'
        )
        response = authenticated_client.get('/api/v1/teachers/?subject=Mathématiques')
        assert response.status_code == status.HTTP_200_OK


# ========== TESTS DÉTAILS PROFESSEUR ==========

class TestTeacherDetail:
    """Tests pour les détails d'un professeur"""
    
    def test_get_teacher_detail(self, authenticated_client, teacher):
        """Test obtenir les détails d'un professeur"""
        response = authenticated_client.get(f'/api/v1/teachers/{teacher.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == teacher.id
        assert response.data['full_name'] == 'Jean Dupont'


# ========== TESTS QUALIFICATIONS ==========

class TestTeacherQualifications:
    """Tests pour les qualifications"""
    
    def test_get_qualifications(self, authenticated_client, teacher):
        """Test obtenir les qualifications"""
        TeacherQualification.objects.create(
            teacher=teacher,
            qualification_type='MASTER',
            field_of_study='Mathématiques',
            institution='Université d\'État',
            graduation_year=2015
        )
        response = authenticated_client.get(f'/api/v1/teachers/{teacher.id}/qualifications/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
    
    def test_add_qualification(self, authenticated_client, teacher):
        """Test ajouter une qualification"""
        data = {
            'qualification_type': 'MASTER',
            'field_of_study': 'Mathématiques',
            'institution': 'Université d\'État',
            'graduation_year': 2015
        }
        response = authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/add-qualification/',
            data
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert teacher.qualifications.count() == 1


# ========== TESTS SPÉCIALITÉS ==========

class TestTeacherSpecialties:
    """Tests pour les spécialités"""
    
    def test_get_specialties(self, authenticated_client, teacher):
        """Test obtenir les spécialités"""
        TeacherSpecialty.objects.create(
            teacher=teacher,
            subject='Mathématiques',
            level='SECONDARY'
        )
        response = authenticated_client.get(f'/api/v1/teachers/{teacher.id}/specialties/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
    
    def test_add_specialty(self, authenticated_client, teacher):
        """Test ajouter une spécialité"""
        data = {
            'subject': 'Physique',
            'level': 'SECONDARY',
            'certification_level': 'ADVANCED',
            'years_of_experience': 5
        }
        response = authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/add-specialty/',
            data
        )
        assert response.status_code == status.HTTP_201_CREATED


# ========== TESTS HORAIRE ==========

class TestTeacherSchedule:
    """Tests pour l'horaire"""
    
    def test_get_schedule(self, authenticated_client, teacher):
        """Test obtenir l'horaire"""
        TeacherSchedule.objects.create(
            teacher=teacher,
            day_of_week='MONDAY',
            start_time=time(8, 0),
            end_time=time(12, 0)
        )
        response = authenticated_client.get(f'/api/v1/teachers/{teacher.id}/schedule/')
        assert response.status_code == status.HTTP_200_OK


# ========== TESTS PRÉSENCE ==========

class TestTeacherAttendance:
    """Tests pour la présence"""
    
    def test_get_attendance(self, authenticated_client, teacher):
        """Test obtenir les présences"""
        TeacherAttendance.objects.create(
            teacher=teacher,
            date=timezone.now().date(),
            is_present=True
        )
        response = authenticated_client.get(f'/api/v1/teachers/{teacher.id}/attendance/')
        assert response.status_code == status.HTTP_200_OK
        assert 'statistics' in response.data
    
    def test_mark_attendance(self, authenticated_client, teacher):
        """Test marquer la présence"""
        data = {
            'date': timezone.now().date().isoformat(),
            'is_present': True,
            'check_in_time': '08:00:00'
        }
        response = authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/mark-attendance/',
            data
        )
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
    
    def test_mark_absence(self, authenticated_client, teacher):
        """Test marquer une absence"""
        data = {
            'date': timezone.now().date().isoformat(),
            'is_present': False,
            'absence_type': 'SICK',
            'reason': 'Maladie'
        }
        response = authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/mark-attendance/',
            data
        )
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
    
    def test_attendance_report(self, authenticated_client, teacher):
        """Test rapport de présence"""
        # Créer quelques présences
        for i in range(5):
            TeacherAttendance.objects.create(
                teacher=teacher,
                date=timezone.now().date() - timedelta(days=i),
                is_present=True if i % 2 == 0 else False
            )
        
        start_date = (timezone.now().date() - timedelta(days=10)).isoformat()
        end_date = timezone.now().date().isoformat()
        
        response = authenticated_client.get(
            f'/api/v1/teachers/{teacher.id}/attendance-report/?'
            f'start_date={start_date}&end_date={end_date}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'statistics' in response.data


# ========== TESTS PERFORMANCE ==========

class TestTeacherPerformance:
    """Tests pour les évaluations de performance"""
    
    def test_get_performance_reviews(self, authenticated_client, teacher, admin_user):
        """Test obtenir les évaluations"""
        TeacherPerformanceReview.objects.create(
            teacher=teacher,
            reviewer=admin_user,
            review_period='ANNUAL',
            teaching_quality=4,
            student_engagement=4,
            professionalism=5,
            communication=4,
            class_management=4
        )
        response = authenticated_client.get(
            f'/api/v1/teachers/{teacher.id}/performance-reviews/'
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'reviews' in response.data
    
    def test_add_performance_review(self, authenticated_client, teacher):
        """Test ajouter une évaluation"""
        data = {
            'review_period': 'ANNUAL',
            'teaching_quality': 4,
            'student_engagement': 4,
            'professionalism': 5,
            'communication': 4,
            'class_management': 4,
            'comments': 'Très bon travail'
        }
        response = authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/add-performance-review/',
            data
        )
        assert response.status_code == status.HTTP_201_CREATED


# ========== TESTS CONGÉS ==========

class TestTeacherLeave:
    """Tests pour les congés"""
    
    def test_request_leave(self, teacher_authenticated_client, teacher):
        """Test demander un congé"""
        data = {
            'leave_type': 'ANNUAL',
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now().date() + timedelta(days=5)).isoformat(),
            'reason': 'Vacances en famille'
        }
        response = teacher_authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/request-leave/',
            data
        )
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_get_leave_requests(self, authenticated_client, teacher):
        """Test obtenir les demandes de congé"""
        TeacherLeaveRequest.objects.create(
            teacher=teacher,
            leave_type='ANNUAL',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=5),
            reason='Congés'
        )
        response = authenticated_client.get(
            f'/api/v1/teachers/{teacher.id}/leave-requests/'
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_approve_leave(self, authenticated_client, teacher, admin_user):
        """Test approver un congé"""
        leave = TeacherLeaveRequest.objects.create(
            teacher=teacher,
            leave_type='ANNUAL',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=5),
            reason='Congés'
        )
        data = {'status': 'APPROVED'}
        response = authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/leave-requests/{leave.id}/approve/',
            data
        )
        assert response.status_code == status.HTTP_200_OK
        leave.refresh_from_db()
        assert leave.status == 'APPROVED'
    
    def test_reject_leave(self, authenticated_client, teacher):
        """Test rejeter un congé"""
        leave = TeacherLeaveRequest.objects.create(
            teacher=teacher,
            leave_type='ANNUAL',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=5),
            reason='Congés'
        )
        data = {
            'status': 'REJECTED',
            'rejection_reason': 'Période critique'
        }
        response = authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/leave-requests/{leave.id}/approve/',
            data
        )
        assert response.status_code == status.HTTP_200_OK


# ========== TESTS NOTES ==========

class TestTeacherRating:
    """Tests pour les notes/évaluations"""
    
    def test_update_rating(self, authenticated_client, teacher):
        """Test ajouter une note"""
        data = {'rating_value': 4.5}
        response = authenticated_client.post(
            f'/api/v1/teachers/{teacher.id}/update-rating/',
            data
        )
        assert response.status_code == status.HTTP_200_OK
        teacher.refresh_from_db()
        assert teacher.rating > 0


# ========== TESTS RECHERCHE ==========

class TestTeacherSearch:
    """Tests pour la recherche"""
    
    def test_find_teachers_by_subject(self, authenticated_client, teacher):
        """Test trouver des professeurs par matière"""
        TeacherSpecialty.objects.create(
            teacher=teacher,
            subject='Mathématiques',
            level='SECONDARY'
        )
        response = authenticated_client.get('/api/v1/teachers/by-subject/?subject=Mathématiques')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] > 0


# ========== TESTS MODÈLES ==========

class TestTeacherModels:
    """Tests pour les modèles"""
    
    def test_teacher_creation(self, teacher):
        """Test création d'un professeur (auto via signal)"""
        assert teacher.teacher_id is not None
        assert teacher.status == 'ACTIVE'
    
    def test_teacher_full_name(self, teacher):
        """Test full_name property"""
        assert teacher.full_name == 'Jean Dupont'
    
    def test_teacher_email(self, teacher):
        """Test email property"""
        assert teacher.email == 'teacher@example.com'
    
    def test_qualification_expiration(self, teacher):
        """Test vérification d'expiration"""
        qual = TeacherQualification.objects.create(
            teacher=teacher,
            qualification_type='MASTER',
            field_of_study='Math',
            institution='Université',
            graduation_year=2015,
            expiration_date=timezone.now().date() - timedelta(days=1)
        )
        assert qual.is_expired
    
    def test_leave_request_duration(self, teacher):
        """Test calcul de durée de congé"""
        leave = TeacherLeaveRequest.objects.create(
            teacher=teacher,
            leave_type='ANNUAL',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=5),
            reason='Congés'
        )
        assert leave.duration_days == 6