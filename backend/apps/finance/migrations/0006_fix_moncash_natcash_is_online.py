from django.db import migrations


def fix_moncash_natcash_online_flag(apps, schema_editor):
    """
    MonCash et NatCash ne sont pas des passerelles automatiques au CEJEC :
    l'agent constate le SMS de confirmation et saisit le paiement manuellement.
    On les passe en is_online=False pour qu'ils soient acceptés par
    PaymentCreateSerializer.validate_payment_method() et affichés dans le
    formulaire d'encaissement.
    """
    PaymentMethod = apps.get_model("finance", "PaymentMethod")
    PaymentMethod.objects.filter(code__in=["moncash", "natcash"]).update(is_online=False)


def reverse_fix(apps, schema_editor):
    PaymentMethod = apps.get_model("finance", "PaymentMethod")
    PaymentMethod.objects.filter(code__in=["moncash", "natcash"]).update(is_online=True)


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0005_seed_payment_methods"),
    ]

    operations = [
        migrations.RunPython(fix_moncash_natcash_online_flag, reverse_fix),
    ]
