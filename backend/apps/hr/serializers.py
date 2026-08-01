from rest_framework import serializers

from apps.hr.models import (
    AuditLog,
    Contract,
    HRDocument,
    Leave,
    LeaveType,
    PerformanceEvaluation,
    Salary,
)


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "days_per_year", "is_paid"]


class ContractSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.__str__", read_only=True)

    class Meta:
        model = Contract
        fields = [
            "id", "teacher", "teacher_name", "contract_type", "start_date", "end_date",
            "monthly_salary", "currency", "status", "contract_file",
            "notice_period_days", "termination_reason", "termination_date",
            "created_at", "updated_at",
        ]
        read_only_fields = ["status", "termination_reason", "termination_date"]

    def validate(self, attrs):
        instance = Contract(**{**(self.instance.__dict__ if self.instance else {}), **attrs})
        instance.pk = self.instance.pk if self.instance else None
        instance.clean()
        return attrs


class SalarySerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.__str__", read_only=True)

    class Meta:
        model = Salary
        fields = [
            "id", "teacher", "teacher_name", "contract", "pay_period_start", "pay_period_end",
            "base_salary", "bonuses", "deductions", "net_salary", "status",
            "payment_date", "payment_reference", "payslip_file",
            "created_at", "updated_at",
        ]
        read_only_fields = ["net_salary", "status", "payment_date"]


class LeaveSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.__str__", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)

    class Meta:
        model = Leave
        fields = [
            "id", "teacher", "teacher_name", "leave_type", "leave_type_name",
            "start_date", "end_date", "days_used", "status", "approver",
            "reason", "attachment", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "approver"]

    def validate(self, attrs):
        instance = Leave(**{**(self.instance.__dict__ if self.instance else {}), **attrs})
        instance.pk = self.instance.pk if self.instance else None
        instance.clean()
        return attrs


class PerformanceEvaluationSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.__str__", read_only=True)

    class Meta:
        model = PerformanceEvaluation
        fields = [
            "id", "teacher", "teacher_name", "evaluator", "evaluation_date",
            "evaluation_period_start", "evaluation_period_end", "rating",
            "criteria_scores", "strengths", "areas_for_improvement",
            "evaluation_type", "teacher_acknowledged", "teacher_comments",
            "created_at", "updated_at",
        ]
        read_only_fields = ["teacher_acknowledged", "evaluator"]


class HRDocumentSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        uploaded = validated_data.get('file')
        if uploaded and not validated_data.get('filename'):
            validated_data['filename'] = uploaded.name
        return super().create(validated_data)

    class Meta:
        model = HRDocument
        fields = [
            "id", "teacher", "document_type", "filename", "file",
            "expiry_date", "status", "created_at",
        ]
        read_only_fields = ["status"]


class AuditLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.CharField(source="admin.__str__", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id", "admin", "admin_name", "entity_type", "entity_id",
            "action", "changes_json", "ip_address", "action_at",
        ]
        read_only_fields = fields
