import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.users.models import User

@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        email='admin@test.com',
        password='StrongPass123',
        first_name='Admin',
        last_name='User',
        role='ADMIN',
        is_staff=True,
        is_superuser=True,
        is_active=True,
    )
    return user

@pytest.fixture
def api_client():
    return APIClient()

def obtain_jwt_token(client, email, password):
    url = reverse('token_obtain_pair')
    response = client.post(url, {'email': email, 'password': password}, format='json')
    assert response.status_code == 200
    return response.data['access']

def test_dashboard_stats_endpoint(admin_user, api_client):
    token = obtain_jwt_token(api_client, admin_user.email, 'StrongPass123')
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    url = reverse('dashboard-stats')
    response = api_client.get(url)
    assert response.status_code == 200
    data = response.json()
    expected_keys = {'students_count', 'teachers_count', 'courses_count', 'attendance_records'}
    assert expected_keys.issubset(data.keys())
