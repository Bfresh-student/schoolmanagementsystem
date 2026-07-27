from datetime import date

from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.hr.models import (
    AuditAction,
    AuditEntityType,
    AuditLog,
    Contract,
    HRDocument,
    Leave,
    LeaveStatus,
    LeaveType,
    PerformanceEvaluation,
    Salary,
)
from apps.hr.permissions import HR_STAFF_ROLES, IsHRStaff, IsHRStaffOrOwnerReadOnly
from apps.hr.serializers import (
    AuditLogSerializer,
    ContractSerializer,
    HRDocumentSerializer,
    LeaveSerializer,
    LeaveTypeSerializer,
    PerformanceEvaluationSerializer,
    SalarySerializer,
)


def _role_name(user):
    return getattr(getattr(user, "role", None), "name", None)


class AuditLogMixin:
    """
    Journalise automatiquement create/update/delete dans AUDIT_LOG.
    Chaque ViewSet doit définir `audit_entity_type` (voir AuditEntityType).
    """

    audit_entity_type = None

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.record(
            user=self.request.user,
            action=AuditAction.CREATE,
            entity_type=self.audit_entity_type,
            entity_id=instance.pk,
            new=serializer.data,
            request=self.request,
        )

    def perform_update(self, serializer):
        old_data = self.get_serializer(self.get_object()).data
        instance = serializer.save()
        AuditLog.record(
            user=self.request.user,
            action=AuditAction.UPDATE,
            entity_type=self.audit_entity_type,
            entity_id=instance.pk,
            old=old_data,
            new=serializer.data,
            request=self.request,
        )

    def perform_destroy(self, instance):
        old_data = self.get_serializer(instance).data
        entity_id = instance.pk
        instance.delete()
        AuditLog.record(
            user=self.request.user,
            action=AuditAction.DELETE,
            entity_type=self.audit_entity_type,
            entity_id=entity_id,
            old=old_data,
            request=self.request,
        )


class TeacherScopedQuerysetMixin:
    """
    Restreint le queryset aux objets du teacher connecté, sauf pour
    Admin/HR qui voient tout. Suppose `teacher.user_id` sur le modèle.
    """

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _role_name(user) in HR_STAFF_ROLES:
            return qs
        return qs.filter(teacher__user_id=user.id)


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsHRStaff]


class ContractViewSet(AuditLogMixin, TeacherScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Contract.objects.select_related("teacher").all()
    serializer_class = ContractSerializer
    permission_classes = [IsHRStaffOrOwnerReadOnly]
    audit_entity_type = AuditEntityType.CONTRACT

    @action(detail=True, methods=["post"], permission_classes=[IsHRStaff])
    def terminate(self, request, pk=None):
        contract = self.get_object()
        reason = request.data.get("reason", "")
        termination_date = request.data.get("termination_date")
        contract.terminate(reason=reason, termination_date=termination_date)
        AuditLog.record(
            user=request.user,
            action=AuditAction.UPDATE,
            entity_type=AuditEntityType.CONTRACT,
            entity_id=contract.pk,
            new={"status": contract.status, "termination_reason": reason},
            request=request,
        )
        return Response(ContractSerializer(contract).data)


class SalaryViewSet(AuditLogMixin, TeacherScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Salary.objects.select_related("teacher", "contract").all()
    serializer_class = SalarySerializer
    permission_classes = [IsHRStaffOrOwnerReadOnly]
    audit_entity_type = AuditEntityType.SALARY

    @action(detail=True, methods=["post"], permission_classes=[IsHRStaff])
    def mark_paid(self, request, pk=None):
        salary = self.get_object()
        salary.mark_paid(
            payment_date=request.data.get("payment_date"),
            payment_reference=request.data.get("payment_reference", ""),
        )
        AuditLog.record(
            user=request.user,
            action=AuditAction.UPDATE,
            entity_type=AuditEntityType.SALARY,
            entity_id=salary.pk,
            new={"status": salary.status, "payment_date": str(salary.payment_date)},
            request=request,
        )
        return Response(SalarySerializer(salary).data)

    @action(detail=True, methods=["get"], permission_classes=[IsHRStaffOrOwnerReadOnly])
    def payslip(self, request, pk=None):
        salary = self.get_object()
        if not salary.payslip_file:
            raise Http404("Aucun bulletin de paie disponible pour cette période.")
        return FileResponse(salary.payslip_file.open("rb"), as_attachment=True)


class LeaveViewSet(AuditLogMixin, TeacherScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Leave.objects.select_related("teacher", "leave_type", "approver").all()
    serializer_class = LeaveSerializer
    permission_classes = [IsHRStaffOrOwnerReadOnly]
    audit_entity_type = AuditEntityType.LEAVE

    @action(detail=True, methods=["post"], permission_classes=[IsHRStaff])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.approve(approver=request.user)
        AuditLog.record(
            user=request.user,
            action=AuditAction.APPROVE,
            entity_type=AuditEntityType.LEAVE,
            entity_id=leave.pk,
            new={"status": leave.status},
            request=request,
        )
        return Response(LeaveSerializer(leave).data)

    @action(detail=True, methods=["post"], permission_classes=[IsHRStaff])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.reject(approver=request.user)
        AuditLog.record(
            user=request.user,
            action=AuditAction.REJECT,
            entity_type=AuditEntityType.LEAVE,
            entity_id=leave.pk,
            new={"status": leave.status},
            request=request,
        )
        return Response(LeaveSerializer(leave).data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def balance(self, request):
        """Solde de congés du teacher connecté, par type de congé, pour l'année en cours."""
        teacher = getattr(request.user, "teacher", None)
        if teacher is None:
            return Response(
                {"detail": "Cet utilisateur n'est pas un formateur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        year = int(request.query_params.get("year", timezone.now().year))
        data = [
            {
                "leave_type": lt.name,
                "days_per_year": lt.days_per_year,
                "remaining": Leave.remaining_balance(teacher, lt, year),
            }
            for lt in LeaveType.objects.all()
        ]
        return Response(data)


class PerformanceEvaluationViewSet(
    AuditLogMixin, TeacherScopedQuerysetMixin, viewsets.ModelViewSet
):
    queryset = PerformanceEvaluation.objects.select_related("teacher", "evaluator").all()
    serializer_class = PerformanceEvaluationSerializer
    permission_classes = [IsHRStaffOrOwnerReadOnly]
    audit_entity_type = AuditEntityType.EVALUATION

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)
        AuditLog.record(
            user=self.request.user,
            action=AuditAction.CREATE,
            entity_type=self.audit_entity_type,
            entity_id=serializer.instance.pk,
            new=serializer.data,
            request=self.request,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def acknowledge(self, request, pk=None):
        evaluation = self.get_object()
        teacher = getattr(request.user, "teacher", None)
        if teacher is None or evaluation.teacher_id != teacher.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        evaluation.acknowledge(comments=request.data.get("comments", ""))
        return Response(PerformanceEvaluationSerializer(evaluation).data)


class HRDocumentViewSet(AuditLogMixin, TeacherScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = HRDocument.objects.select_related("teacher").all()
    serializer_class = HRDocumentSerializer
    permission_classes = [IsHRStaffOrOwnerReadOnly]
    audit_entity_type = AuditEntityType.HR_DOCUMENT


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Lecture seule : l'audit log ne s'écrit jamais manuellement via l'API."""

    queryset = AuditLog.objects.select_related("admin").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsHRStaff]
