from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("invoices", views.InvoiceViewSet, basename="invoice")
router.register("payments", views.PaymentViewSet, basename="payment")
router.register("payment-methods", views.PaymentMethodViewSet, basename="payment-method")

urlpatterns = [
    path("", include(router.urls)),
    path("webhooks/stripe/", views.StripeWebhookView.as_view(), name="webhook-stripe"),
    path("webhooks/paypal/", views.PayPalWebhookView.as_view(), name="webhook-paypal"),
    path("webhooks/mobile-money/", views.MobileMoneyWebhookView.as_view(), name="webhook-mobile-money"),
]
