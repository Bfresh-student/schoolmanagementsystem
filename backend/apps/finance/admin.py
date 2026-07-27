from django.contrib import admin

from .models import Invoice, Payment, PaymentMethod, Receipt, WebhookEvent


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "is_active", "is_online"]
    list_filter = ["is_active", "is_online"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["invoice_number", "student", "amount", "amount_paid", "status", "due_date"]
    list_filter = ["status"]
    search_fields = ["invoice_number", "student__registration_number"]
    readonly_fields = ["invoice_number", "amount_paid", "created_at", "updated_at"]


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ["id", "status", "gateway_reference", "created_at", "paid_at"]
    can_delete = False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "invoice", "student", "amount", "status", "payment_method", "synced", "created_at"]
    list_filter = ["status", "payment_method", "synced"]
    search_fields = ["gateway_reference", "idempotency_key"]
    readonly_fields = ["created_at", "updated_at", "paid_at"]
    actions = ["confirm_selected_manual_payments"]

    @admin.action(description="Confirmer les paiements manuels sélectionnés (espèces/virement)")
    def confirm_selected_manual_payments(self, request, queryset):
        from .services import PaymentError, PaymentService

        confirmed = 0
        for payment in queryset.filter(status=Payment.Status.PENDING):
            try:
                PaymentService.confirm_manual(payment, confirmed_by=request.user)
                confirmed += 1
            except PaymentError:
                continue
        self.message_user(request, f"{confirmed} paiement(s) confirmé(s).")


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ["receipt_number", "payment", "generated_at"]
    readonly_fields = ["receipt_number", "generated_at"]


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ["provider", "external_event_id", "processed", "received_at"]
    list_filter = ["provider", "processed"]
    readonly_fields = ["provider", "external_event_id", "payload", "received_at"]
