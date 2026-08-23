from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import InscriptionViewSet, PreInscriptionView, PreInscriptionViewSet

router = DefaultRouter()
router.register(r"inscriptions", InscriptionViewSet, basename="inscription")
router.register(r"pre-inscriptions", PreInscriptionViewSet, basename="pre-inscription-admin")

urlpatterns = router.urls + [
    path("pre-inscription/", PreInscriptionView.as_view(), name="pre-inscription"),
]

