from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("enrollments", "0006_inscription_academic_year"),
    ]

    operations = [
        migrations.AddField(
            model_name="inscription",
            name="metadata",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Informations complémentaires saisies dans le dossier d'inscription.",
            ),
        ),
    ]