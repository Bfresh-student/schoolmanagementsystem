from django.db import migrations


def normalize_employee_numbers(apps, schema_editor):
    Employee = apps.get_model("hr", "Employee")
    Teacher = apps.get_model("teachers", "Teacher")
    employees = list(Employee.objects.order_by("id"))

    # The unique constraint is immediate in PostgreSQL. Move every row out
    # of the final namespace before assigning the normalized values.
    for employee in employees:
        Employee.objects.filter(pk=employee.pk).update(
            employee_number=f"__migrate_employee_{employee.pk}"
        )

    teacher_ids = {
        teacher.user_id: teacher.teacher_id
        for teacher in Teacher.objects.all()
        if teacher.user_id
    }
    used_numbers = set()
    employee_number = 1
    teacher_number = 1

    for employee in employees:
        is_teacher = any(
            word in (employee.job_title or "").lower()
            for word in ("prof", "enseign")
        )
        if is_teacher:
            number = teacher_ids.get(employee.user_id)
            while not number or number in used_numbers:
                number = f"pf{teacher_number:04d}"
                teacher_number += 1
        else:
            number = f"em{employee_number:06d}"
            employee_number += 1
        used_numbers.add(number)
        Employee.objects.filter(pk=employee.pk).update(employee_number=number)


class Migration(migrations.Migration):
    dependencies = [
        ("hr", "0008_alter_employee_employee_number"),
        ("teachers", "0003_normalize_teacher_ids"),
    ]

    operations = [migrations.RunPython(normalize_employee_numbers, migrations.RunPython.noop)]