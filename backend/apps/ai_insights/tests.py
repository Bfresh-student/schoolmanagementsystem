import pytest
from rest_framework.test import APIClient
from apps.users.models import User
from apps.ai_insights.models import InsightRequest, InsightStatus


@pytest.mark.django_db
class TestAIInsightsAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="ai_user@test.com", password="password123", role="ADMIN"
        )

    def test_create_insight_request(self):
        request_obj = InsightRequest.objects.create(
            prompt="Evaluer la progression globale en mathematiques",
            insight_type="academic_performance",
            requested_by=self.user,
        )
        assert request_obj.id is not None
        assert request_obj.status == InsightStatus.PENDING

    def test_ai_insights_list_endpoint(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/ai-insights/requests/")
        assert response.status_code == 200
