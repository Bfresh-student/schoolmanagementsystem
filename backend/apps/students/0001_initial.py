import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Specialization",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Spécialisation",
                "verbose_name_plural": "Spécialisations",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Student",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("registration_number", models.CharField(editable=False, max_length=30, unique=True)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("address", models.TextField(blank=True)),
                ("emergency_contacts", models.JSONField(blank=True, default=list)),
                ("enrollment_date", models.DateField(auto_now_add=True)),
                ("status", models.CharField(
                    choices=[
                        ("active", "Actif"),
                        ("suspended", "Suspendu"),
                        ("graduated", "Diplômé"),
                        ("withdrawn", "Abandon"),
                    ],
                    default="active",
                    max_length=20,
                )),
                ("is_active", models.BooleanField(default=True)),
                ("synced", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("specialization", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="students",
                    to="students.specialization",
                )),
                ("user", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="student_profile",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "verbose_name": "Élève",
                "verbose_name_plural": "Élèves",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="student",
            index=models.Index(fields=["registration_number"], name="students_st_registr_idx"),
        ),
        migrations.AddIndex(
            model_name="student",
            index=models.Index(fields=["status"], name="students_st_status_idx"),
        ),
    ]
