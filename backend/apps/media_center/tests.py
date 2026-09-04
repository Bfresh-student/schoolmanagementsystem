import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
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

    def test_article_engagement_comments_and_gallery_are_persisted(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/v1/media-center/articles/", {
            "title": "Article avec galerie",
            "content": "Contenu publié",
            "status": "published",
            "gallery_files": [SimpleUploadedFile("photo.jpg", b"image", content_type="image/jpeg")],
        }, format="multipart")
        assert response.status_code == 201, response.data
        article_id = response.data["id"]
        assert len(response.data["gallery"]) == 1

        view = self.client.post(f"/api/v1/media-center/articles/{article_id}/increment_view/")
        share = self.client.post(f"/api/v1/media-center/articles/{article_id}/increment_share/")
        comment = self.client.post(f"/api/v1/media-center/articles/{article_id}/comments/", {
            "author_name": "Visiteur", "author_email": "visiteur@example.com", "content": "Très bon article"
        })
        assert view.status_code == 200
        assert share.status_code == 200
        assert comment.status_code == 201, comment.data

        detail = self.client.get(f"/api/v1/media-center/articles/{article_id}/")
        assert detail.data["views_count"] == 1
        assert detail.data["shares_count"] == 1
        assert detail.data["comments_count"] == 1
        assert detail.data["recent_comments"][0]["content"] == "Très bon article"
