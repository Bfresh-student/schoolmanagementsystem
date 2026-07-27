from django.contrib import admin

from apps.hr.models import (
    AuditLog,
    Contract,
    HRDocument,
    Leave,
    LeaveType,
    PerformanceEvaluation,
    Salary,
)


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "days_per_year", "is_paid")


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("teacher", "contract_type", "status", "start_date", "end_date", "monthly_salary", "currency")
    list_filter = ("status", "contract_type", "currency")
    search_fields = ("teacher__user__first_name", "teacher__user__last_name")


@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ("teacher", "pay_period_start", "pay_period_end", "net_salary", "status")
    list_filter = ("status",)
    readonly_fields = ("net_salary",)


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ("teacher", "leave_type", "start_date", "end_date", "days_used", "status", "approver")
    list_filter = ("status", "leave_type")


@admin.register(PerformanceEvaluation)
class PerformanceEvaluationAdmin(admin.ModelAdmin):
    list_display = ("teacher", "evaluator", "evaluation_date", "rating", "evaluation_type", "teacher_acknowledged")
    list_filter = ("evaluation_type", "teacher_acknowledged")


@admin.register(HRDocument)
class HRDocumentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "document_type", "expiry_date", "status")
    list_filter = ("document_type", "status")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action_at", "admin", "action", "entity_type", "entity_id")
    list_filter = ("action", "entity_type")
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        # L'audit log ne doit jamais être écrit manuellement.
        return False

    def has_change_permission(self, request, obj=None):
        return False
