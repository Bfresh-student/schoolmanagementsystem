from rest_framework import serializers
from django.forms.models import model_to_dict

from apps.hr.models import (
    AuditLog,
    Candidate,
    Contract,
    Employee,
    EmployeeAttendance,
    HRDocument,
    Leave,
    LeaveType,
    PerformanceEvaluation,
    Salary,
)


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ["id", "employee_number", "first_name", "last_name", "gender", "phone", "email", "address", "job_title", "department", "hire_date", "status", "monthly_salary", "monthly_bonus", "created_at", "updated_at"]

    def validate(self, attrs):
        title = attrs.get("job_title", getattr(self.instance, "job_title", ""))
        email = attrs.get("email", getattr(self.instance, "email", ""))
        if any(word in (title or "").lower() for word in ("prof", "enseign")) and not email:
            raise serializers.ValidationError({"email": "L'email est obligatoire pour créer le compte professeur."})
        return attrs


class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ["id", "first_name", "last_name", "phone", "email", "position", "application_date", "status", "interview_date", "interview_time", "interviewer", "notes", "cv_file", "created_at", "updated_at"]


class EmployeeAttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)

    class Meta:
        model = EmployeeAttendance
        fields = ["id", "employee", "employee_name", "date", "check_in_time", "check_out_time", "status", "notes", "created_at", "updated_at"]

    def validate(self, attrs):
        values = model_to_dict(self.instance) if self.instance else {}
        instance = EmployeeAttendance(**{**values, **attrs})
        instance.pk = self.instance.pk if self.instance else None
        instance.clean()
        return attrs

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "days_per_year", "is_paid"]


class ContractSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)

    class Meta:
        model = Contract
        fields = [
            "id", "employee", "employee_name", "contract_type", "start_date", "end_date",
            "monthly_salary", "currency", "status", "contract_file",
            "notice_period_days", "termination_reason", "termination_date",
            "created_at", "updated_at",
        ]
        read_only_fields = ["status", "termination_reason", "termination_date"]

    def validate(self, attrs):
        values = model_to_dict(self.instance) if self.instance else {}
        instance = Contract(**{**values, **attrs})
        instance.pk = self.instance.pk if self.instance else None
        instance.clean()
        return attrs


class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)

    class Meta:
        model = Salary
        fields = [
            "id", "employee", "employee_name", "contract", "pay_period_start", "pay_period_end",
            "base_salary", "bonuses", "deductions", "net_salary", "status",
            "payment_date", "payment_reference", "payslip_file",
            "created_at", "updated_at",
        ]
        read_only_fields = ["net_salary", "status", "payment_date"]

    def validate(self, attrs):
        values = model_to_dict(self.instance) if self.instance else {}
        instance = Salary(**{**values, **attrs})
        instance.pk = self.instance.pk if self.instance else None
        instance.clean()
        return attrs


class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)

    class Meta:
        model = Leave
        fields = [
            "id", "employee", "employee_name", "leave_type", "leave_type_name",
            "start_date", "end_date", "days_used", "status", "approver",
            "reason", "attachment", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "approver"]

    def validate(self, attrs):
        values = model_to_dict(self.instance) if self.instance else {}
        instance = Leave(**{**values, **attrs})
        instance.pk = self.instance.pk if self.instance else None
        instance.clean()
        return attrs


class PerformanceEvaluationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)

    class Meta:
        model = PerformanceEvaluation
        fields = [
            "id", "employee", "employee_name", "evaluator", "evaluation_date",
            "evaluation_period_start", "evaluation_period_end", "rating",
            "criteria_scores", "strengths", "areas_for_improvement",
            "evaluation_type", "employee_acknowledged", "employee_comments",
            "created_at", "updated_at",
        ]
        read_only_fields = ["employee_acknowledged", "evaluator"]

    def validate(self, attrs):
        """Validate a complete period on both POST and PATCH."""
        start = attrs.get("evaluation_period_start", getattr(self.instance, "evaluation_period_start", None))
        end = attrs.get("evaluation_period_end", getattr(self.instance, "evaluation_period_end", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"evaluation_period_end": "La fin de période ne peut pas précéder son début."}
            )
        return attrs


class HRDocumentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)
    def create(self, validated_data):
        uploaded = validated_data.get('file')
        if uploaded and not validated_data.get('filename'):
            validated_data['filename'] = uploaded.name
        return super().create(validated_data)

    class Meta:
        model = HRDocument
        fields = [
            "id", "employee", "employee_name", "document_type", "filename", "file", "description",
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
