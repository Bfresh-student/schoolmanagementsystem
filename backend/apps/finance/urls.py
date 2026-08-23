from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("invoices", views.InvoiceViewSet, basename="invoice")
router.register("payments", views.PaymentViewSet, basename="payment")
router.register("payment-methods", views.PaymentMethodViewSet, basename="payment-method")

urlpatterns = [
    path("", include(router.urls)),
]