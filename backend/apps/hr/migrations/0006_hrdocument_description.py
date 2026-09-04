from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("hr", "0005_seed_leave_types")]

    operations = [
        migrations.AddField(
            model_name="hrdocument",
            name="description",
            field=models.TextField(blank=True),
        ),
    ]
