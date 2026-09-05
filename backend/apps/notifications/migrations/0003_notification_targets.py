from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("notifications", "0002_initial")]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="target_url",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="notification",
            name="target_modal",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="notification",
            name="target_id",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]