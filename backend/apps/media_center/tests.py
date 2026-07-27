import pytest
from rest_framework.test import APIClient
from apps.users.models import User
from apps.media_center.models import MediaAsset, MediaType


@pytest.mark.django_db
class TestMediaCenterAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="media_user@test.com", password="password123", role="ADMIN"
        )

    def test_create_media_asset(self):
        asset = MediaAsset.objects.create(
            title="Document de cours",
            description="Guide d'apprentissage",
            media_type=MediaType.DOCUMENT,
            uploaded_by=self.user,
        )
        assert asset.id is not None
        assert asset.media_type == MediaType.DOCUMENT
        assert str(asset) == "Document de cours (document)"

    def test_media_asset_list_endpoint(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/media-center/assets/")
        assert response.status_code == 200
