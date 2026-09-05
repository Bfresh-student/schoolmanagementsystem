# Data migration: crée les enregistrements AcademicYear pour toutes les
# valeurs distinctes de academic_year déjà présentes dans grades_assessment
# (au format "AAAA-AAAA"), puis marque la plus récente comme active.
# Doit s'exécuter AVANT la migration qui transforme le champ en FK.
from django.db import migrations


def create_academic_years(apps, schema_editor):
    Assessment = apps.get_model("grades", "Assessment")
    AcademicYear = apps.get_model("students", "AcademicYear")

    labels = (
        Assessment.objects
        .exclude(academic_year__isnull=True)
        .exclude(academic_year="")
        .values_list("academic_year", flat=True)
        .distinct()
    )

    created = []
    for label in labels:
        try:
            start_year = int(label[:4])
            end_year = int(label[5:9])
        except (ValueError, IndexError):
            continue
        ay, _ = AcademicYear.objects.get_or_create(
            label=label,
            defaults={
                "start_date": "{}-09-01".format(start_year),
                "end_date": "{}-06-30".format(end_year),
                "is_active": False,
            },
        )
        created.append(ay)

    # Marque la plus récente comme active (si aucune n est déjà active)
    if created and not AcademicYear.objects.filter(is_active=True).exists():
        latest = max(created, key=lambda y: y.label)
        latest.is_active = True
        latest.save(update_fields=["is_active"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("grades", "0004_grade_values_out_of_100"),
        ("students", "0006_academicyear"),
    ]

    operations = [
        migrations.RunPython(create_academic_years, noop),
    ]
