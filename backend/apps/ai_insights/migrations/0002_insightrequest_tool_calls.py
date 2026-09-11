from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_insights', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='insightrequest',
            name='tool_calls',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Audit trail: read-only tools invoked (and their args) while generating this insight.',
            ),
        ),
    ]