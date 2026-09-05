from django.db import migrations


def normalize_employee_numbers(apps, schema_editor):
    Employee = apps.get_model("hr", "Employee")
    Teacher = apps.get_model("teachers", "Teacher")
    for number, employee in enumerate(
        Employee.objects.exclude(job_title__icontains="prof").exclude(job_title__icontains="enseign").order_by("id"),
        start=1,
    ):
        employee.employee_number = f"em{number:06d}"
        employee.save(update_fields=["employee_number"])

    teacher_number = 1
    for employee in Employee.objects.filter(job_title__icontains="prof").order_by("id"):
        teacher = Teacher.objects.filter(user_id=employee.user_id).first() if employee.user_id else None
        employee.employee_number = teacher.teacher_id if teacher else f"pf{teacher_number:04d}"
        teacher_number += 1
        employee.save(update_fields=["employee_number"])


class Migration(migrations.Migration):
    dependencies = [
        ("hr", "0008_alter_employee_employee_number"),
        ("teachers", "0003_normalize_teacher_ids"),
    ]

    operations = [migrations.RunPython(normalize_employee_numbers, migrations.RunPython.noop)]