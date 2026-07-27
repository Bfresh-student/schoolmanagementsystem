from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.projects.views import (
    BusinessPlanViewSet,
    CompanyViewSet,
    InternshipViewSet,
    MentorshipViewSet,
    ProjectViewSet,
)

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")
router.register("companies", CompanyViewSet, basename="company")
router.register("internships", InternshipViewSet, basename="internship")
router.register("mentorships", MentorshipViewSet, basename="mentorship")
router.register("business-plans", BusinessPlanViewSet, basename="business-plan")

app_name = "projects"

urlpatterns = [
    path("", include(router.urls)),
]
