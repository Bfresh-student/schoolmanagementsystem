from django.db import migrations


def normalize_registration_numbers(apps, schema_editor):
    Student = apps.get_model("students", "Student")
    for number, student in enumerate(Student.objects.order_by("id"), start=1):
        student.registration_number = f"elv{number:06d}"
        student.save(update_fields=["registration_number"])


class Migration(migrations.Migration):
    dependencies = [("students", "0006_academicyear")]

    operations = [migrations.RunPython(normalize_registration_numbers, migrations.RunPython.noop)]