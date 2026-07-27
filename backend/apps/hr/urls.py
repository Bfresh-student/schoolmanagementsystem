from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.hr.views import (
    AuditLogViewSet,
    ContractViewSet,
    HRDocumentViewSet,
    LeaveTypeViewSet,
    LeaveViewSet,
    PerformanceEvaluationViewSet,
    SalaryViewSet,
)

router = DefaultRouter()
router.register("leave-types", LeaveTypeViewSet, basename="leave-type")
router.register("contracts", ContractViewSet, basename="contract")
router.register("salaries", SalaryViewSet, basename="salary")
router.register("leaves", LeaveViewSet, basename="leave")
router.register("evaluations", PerformanceEvaluationViewSet, basename="evaluation")
router.register("documents", HRDocumentViewSet, basename="hr-document")
router.register("audit-log", AuditLogViewSet, basename="hr-audit-log")

app_name = "hr"

urlpatterns = [
    path("", include(router.urls)),
]

# Monte ceci dans le urls.py racine du projet, par exemple :
#   path("api/hr/", include("hr.urls")),
