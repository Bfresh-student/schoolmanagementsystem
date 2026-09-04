from datetime import date

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils.dateparse import parse_date

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
    Candidate,
    Contract,
    Employee,
    EmployeeStatus,
    EmployeeAttendance,
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
    CandidateSerializer,
    ContractSerializer,
    EmployeeAttendanceSerializer,
    EmployeeSerializer,
    HRDocumentSerializer,
    LeaveSerializer,
    LeaveTypeSerializer,
    PerformanceEvaluationSerializer,
    SalarySerializer,
)


def _is_teacher_position(job_title: str) -> bool:
    return any(word in (job_title or "").lower() for word in ("prof", "enseign"))


def _sync_teacher_account(employee: Employee):
    """Garantit qu'un employé enseignant possède son compte et sa fiche Teacher."""
    if not _is_teacher_position(employee.job_title):
        return

    from apps.teachers.models import Teacher
    from apps.users.models import User, UserProfile

    user = employee.user
    if user is None:
        user = User.objects.filter(email__iexact=employee.email).first()
    if user is None:
        user = User.objects.create_user(
            email=employee.email,
            password=None,
            first_name=employee.first_name,
            last_name=employee.last_name,
            phone=employee.phone,
            role="TEACHER",
            status="ACTIVE",
        )
    else:
        user.first_name = employee.first_name
        user.last_name = employee.last_name
        user.phone = employee.phone
        user.role = "TEACHER"
        user.status = "ACTIVE" if employee.status == EmployeeStatus.ACTIVE else "INACTIVE"
        user.save(update_fields=["first_name", "last_name", "phone", "role", "status"])

    if employee.user_id != user.id:
        employee.user = user
        employee.save(update_fields=["user", "updated_at"])

    gender_map = {"homme": "M", "masculin": "M", "m": "M", "femme": "F", "féminin": "F", "f": "F"}
    gender = gender_map.get((employee.gender or "").strip().lower())
    if gender:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.gender != gender:
            profile.gender = gender
            profile.save(update_fields=["gender"])

    teacher, created = Teacher.objects.get_or_create(
        user=user,
        defaults={
            "teacher_id": employee.employee_number,
            "hire_date": employee.hire_date,
            "status": "ACTIVE" if employee.status == EmployeeStatus.ACTIVE else "INACTIVE",
            "monthly_salary": employee.monthly_salary,
        },
    )
    if not created:
        teacher.hire_date = employee.hire_date
        teacher.status = "ACTIVE" if employee.status == EmployeeStatus.ACTIVE else "INACTIVE"
        teacher.monthly_salary = employee.monthly_salary
        teacher.save(update_fields=["hire_date", "status", "monthly_salary", "updated_at"])


def _role_name(user):
    role = getattr(user, "role", None)
    if isinstance(role, str):
        return role.lower()
    return getattr(role, "name", "").lower()


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
        return qs.filter(employee__user_id=user.id)


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsHRStaff]


class EmployeeViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsHRStaff]
    audit_entity_type = AuditEntityType.EMPLOYEE

    def get_queryset(self):
        qs = super().get_queryset()
        if search := self.request.query_params.get("search"):
            qs = qs.filter(
                Q(first_name__icontains=search) | Q(last_name__icontains=search)
                | Q(email__icontains=search) | Q(employee_number__icontains=search)
                | Q(job_title__icontains=search) | Q(department__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        with transaction.atomic():
            employee = serializer.save()
            _sync_teacher_account(employee)
        AuditLog.record(
            user=self.request.user, action=AuditAction.CREATE,
            entity_type=self.audit_entity_type, entity_id=employee.pk,
            new=EmployeeSerializer(employee).data, request=self.request,
        )

    def perform_update(self, serializer):
        previous = EmployeeSerializer(self.get_object()).data
        with transaction.atomic():
            employee = serializer.save()
            _sync_teacher_account(employee)
        AuditLog.record(
            user=self.request.user, action=AuditAction.UPDATE,
            entity_type=self.audit_entity_type, entity_id=employee.pk,
            old=previous, new=EmployeeSerializer(employee).data, request=self.request,
        )


class CandidateViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [IsHRStaff]
    audit_entity_type = AuditEntityType.CANDIDATE

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"], permission_classes=[IsHRStaff])
    def schedule_interview(self, request, pk=None):
        candidate = self.get_object()
        if candidate.status != "pending":
            return Response({"detail": "Seul un candidat en attente peut être convoqué en entretien."}, status=status.HTTP_400_BAD_REQUEST)
        interview_date = parse_date(request.data.get("interview_date", ""))
        interview_time = request.data.get("interview_time")
        if not interview_date or not interview_time:
            return Response({"detail": "La date et l'heure de l'entretien sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)
        candidate.status = "interview"
        candidate.interview_date = interview_date
        candidate.interview_time = interview_time
        candidate.interviewer = request.user.get_full_name() or request.user.email
        if request.data.get("notes"):
            candidate.notes = request.data["notes"]
        candidate.save(update_fields=["status", "interview_date", "interview_time", "interviewer", "notes", "updated_at"])
        return Response(CandidateSerializer(candidate).data)

    @action(detail=True, methods=["post"], permission_classes=[IsHRStaff])
    def hire(self, request, pk=None):
        candidate = self.get_object()
        with transaction.atomic():
            candidate = Candidate.objects.select_for_update().get(pk=candidate.pk)
            if candidate.status == "hired":
                return Response({"detail": "Ce candidat est déjà employé."}, status=status.HTTP_400_BAD_REQUEST)
            if candidate.status != "interview":
                return Response({"detail": "Seul un candidat ayant passé l'entretien peut être embauché."}, status=status.HTTP_400_BAD_REQUEST)
            employee = Employee.objects.filter(email__iexact=candidate.email).first()
            dept = request.data.get("department") or "Administration"
            pos_lower = (candidate.position or "").lower()
            if "prof" in pos_lower:
                dept = "Professeurs"
            if not employee:
                employee_number = f"EMP-{timezone.localdate():%Y}-{candidate.pk:06d}"
                employee = Employee.objects.create(
                    employee_number=employee_number,
                    first_name=candidate.first_name,
                    last_name=candidate.last_name,
                    phone=candidate.phone,
                    email=candidate.email,
                    job_title=candidate.position or "Employé",
                    department=dept,
                    hire_date=timezone.localdate(),
                    status=EmployeeStatus.ACTIVE,
                )
            else:
                employee.status = EmployeeStatus.ACTIVE
                if request.data.get("department"):
                    employee.department = request.data["department"]
                employee.save(update_fields=["status", "department", "updated_at"])
            _sync_teacher_account(employee)
            candidate.status = "hired"
            candidate.save(update_fields=["status", "updated_at"])
        AuditLog.record(user=request.user, action=AuditAction.UPDATE, entity_type=AuditEntityType.CANDIDATE, entity_id=candidate.pk, new={"status": "hired", "employee_id": employee.pk}, request=request)
        return Response({"candidate": CandidateSerializer(candidate).data, "employee": EmployeeSerializer(employee).data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsHRStaff])
    def reject_after_interview(self, request, pk=None):
        candidate = self.get_object()
        candidate.status = "rejected"
        candidate.save(update_fields=["status", "updated_at"])
        return Response(CandidateSerializer(candidate).data)


class EmployeeAttendanceViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = EmployeeAttendance.objects.select_related("employee").all()
    serializer_class = EmployeeAttendanceSerializer
    permission_classes = [IsHRStaff]
    audit_entity_type = AuditEntityType.ATTENDANCE

    def get_queryset(self):
        qs = super().get_queryset()
        requested_date = parse_date(self.request.query_params.get("date", ""))
        # Le module Présences affiche par défaut uniquement la journée courante.
        return qs.filter(date=requested_date or timezone.localdate())

    @action(detail=False, methods=["get"], permission_classes=[IsHRStaff], url_path="report-summary")
    def report_summary(self, request):
        start = parse_date(request.query_params.get("start", "")) or timezone.localdate().replace(day=1)
        end = parse_date(request.query_params.get("end", "")) or timezone.localdate()
        if end < start:
            return Response({"detail": "La date de fin doit être postérieure à la date de début."}, status=status.HTTP_400_BAD_REQUEST)
        attendance = EmployeeAttendance.objects.filter(date__range=(start, end)).values("employee_id").annotate(
            present=Count("id", filter=Q(status__in=["present", "late"])),
            absent=Count("id", filter=Q(status__in=["absent", "excused"])),
        )
        attendance_by_employee = {row["employee_id"]: row for row in attendance}
        leave = Leave.objects.filter(status=LeaveStatus.APPROVED, start_date__lte=end, end_date__gte=start).values("employee_id").annotate(days=Sum("days_used"))
        leave_by_employee = {row["employee_id"]: row["days"] for row in leave}
        employees = Employee.objects.all()
        rows = [{
            "employee_id": employee.id,
            "name": str(employee),
            "job_title": employee.job_title,
            "present_days": attendance_by_employee.get(employee.id, {}).get("present", 0),
            "absent_days": attendance_by_employee.get(employee.id, {}).get("absent", 0),
            "leave_days": float(leave_by_employee.get(employee.id, 0) or 0),
            "monthly_salary": str(employee.monthly_salary),
        } for employee in employees]
        return Response({"start": start, "end": end, "employees": rows})

class ContractViewSet(AuditLogMixin, TeacherScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Contract.objects.select_related("employee").all()
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
    queryset = Salary.objects.select_related("employee", "contract").all()
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
    queryset = Leave.objects.select_related("employee", "leave_type", "approver").all()
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
        employee = getattr(request.user, "employee_profile", None)
        if employee is None:
            return Response(
                {"detail": "Cet utilisateur n'est pas un employé/formateur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        year = int(request.query_params.get("year", timezone.now().year))
        data = [
            {
                "leave_type": lt.name,
                "days_per_year": lt.days_per_year,
                "remaining": Leave.remaining_balance(employee, lt, year),
            }
            for lt in LeaveType.objects.all()
        ]
        return Response(data)


class PerformanceEvaluationViewSet(
    AuditLogMixin, TeacherScopedQuerysetMixin, viewsets.ModelViewSet
):
    queryset = PerformanceEvaluation.objects.select_related("employee", "evaluator").all()
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
        employee = getattr(request.user, "employee_profile", None)
        if employee is None or evaluation.employee_id != employee.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        evaluation.acknowledge(comments=request.data.get("comments", ""))
        return Response(PerformanceEvaluationSerializer(evaluation).data)


class HRDocumentViewSet(AuditLogMixin, TeacherScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = HRDocument.objects.select_related("employee").all()
    serializer_class = HRDocumentSerializer
    permission_classes = [IsHRStaffOrOwnerReadOnly]
    audit_entity_type = AuditEntityType.HR_DOCUMENT


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Lecture seule : l'audit log ne s'écrit jamais manuellement via l'API."""

    queryset = AuditLog.objects.select_related("admin").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsHRStaff]
