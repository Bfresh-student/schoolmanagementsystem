from rest_framework.routers import DefaultRouter

from .views import SpecializationViewSet, StudentViewSet
from .views import SchoolClassViewSet
 


router = DefaultRouter()
# -> GET/POST   /api/v1/students/classes/
#    GET/PATCH/DELETE /api/v1/students/classes/<id>/
router.register(r'classes', SchoolClassViewSet, basename='schoolclass')
router.register("students", StudentViewSet, basename="student")
router.register("specializations", SpecializationViewSet, basename="specialization")

urlpatterns = router.urls