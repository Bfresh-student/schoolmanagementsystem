import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    # ⚠️ Renomme ce fichier en respectant la convention Django, ex.
    # 0004_fix_payment_status_and_idempotency_key.py, et remplace
    # "000X_nom_de_ta_derniere_migration" ci-dessous par le nom réel
    # de ta dernière migration dans finance/migrations/.
    dependencies = [
        ("finance", "0003_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="payment",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "En attente"),
                    ("processing", "En cours"),
                    ("completed", "Complété"),
                    ("failed", "Échoué"),
                    ("refunded", "Remboursé"),
                    ("cancelled", "Annulé"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="payment",
            name="idempotency_key",
            field=models.CharField(
                default=uuid.uuid4,
                editable=False,
                max_length=100,
                unique=True,
            ),
        ),
    ]