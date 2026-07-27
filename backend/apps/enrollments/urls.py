from rest_framework.routers import DefaultRouter

from .views import InscriptionViewSet

router = DefaultRouter()
router.register(r"inscriptions", InscriptionViewSet, basename="inscription")

urlpatterns = router.urls
