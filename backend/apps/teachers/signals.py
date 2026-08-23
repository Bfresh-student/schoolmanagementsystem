# ========== SIGNALS.PY CORRIGÉ ==========

from decimal import Decimal

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models import User
from .models import Teacher


def sync_teacher_to_employee(teacher: Teacher) -> None:
    """Crée ou met à jour la fiche RH Employee liée à un professeur (sans doublon)."""
    from apps.hr.models import Employee, EmployeeStatus

    user = teacher.user
    status_map = {
        "ACTIVE": EmployeeStatus.ACTIVE,
        "INACTIVE": EmployeeStatus.INACTIVE,
        "ON_LEAVE": EmployeeStatus.INACTIVE,
        "RETIRED": EmployeeStatus.TERMINATED,
        "TERMINATED": EmployeeStatus.TERMINATED,
    }
    payload = {
        "user": user,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "email": user.email or "",
        "phone": getattr(user, "phone", "") or "",
        "job_title": "Professeur",
        "department": "Professeurs",
        "hire_date": teacher.hire_date,
        "status": status_map.get(teacher.status, EmployeeStatus.ACTIVE),
        "monthly_salary": teacher.monthly_salary if teacher.monthly_salary is not None else Decimal("0"),
    }

    employee = Employee.objects.filter(user=user).first()
    if employee is None and user.email:
        employee = Employee.objects.filter(email=user.email).first()
    if employee is None:
        employee = Employee.objects.filter(employee_number=teacher.teacher_id).first()

    if employee is None:
        Employee.objects.create(employee_number=teacher.teacher_id, **payload)
        return

    for field, value in payload.items():
        setattr(employee, field, value)
    if not employee.employee_number:
        employee.employee_number = teacher.teacher_id
    employee.save()


@receiver(post_save, sender=Teacher)
def sync_employee_on_teacher_save(sender, instance, **kwargs):
    sync_teacher_to_employee(instance)


@receiver(post_save, sender=User)
def create_teacher_profile(sender, instance, created, **kwargs):
    """
    Créer automatiquement un profil professeur si le rôle est TEACHER
    
    NOTE: 
    - Utilise created=True pour éviter les mises à jour
    - Utilise get_or_create pour éviter les doublons
    - Désactiver ce signal dans les tests si nécessaire avec @pytest.mark.disable_signals
    """
    if created and instance.role == 'TEACHER':
        # Générer un ID unique pour le professeur
        teacher_count = Teacher.objects.count() + 1
        teacher_id = f'T{teacher_count:04d}'
        
        # get_or_create évite les doublons si le signal s'exécute plusieurs fois
        Teacher.objects.get_or_create(
            user=instance,
            defaults={
                'teacher_id': teacher_id,
                'status': 'ACTIVE'
            }
        )