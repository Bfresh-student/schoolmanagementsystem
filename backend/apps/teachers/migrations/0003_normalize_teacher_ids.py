from django.db import migrations


def normalize_teacher_ids(apps, schema_editor):
    Teacher = apps.get_model("teachers", "Teacher")
    for number, teacher in enumerate(Teacher.objects.order_by("id"), start=1):
        teacher.teacher_id = f"pf{number:04d}"
        teacher.save(update_fields=["teacher_id"])


class Migration(migrations.Migration):
    dependencies = [("teachers", "0002_initial")]

    operations = [migrations.RunPython(normalize_teacher_ids, migrations.RunPython.noop)]