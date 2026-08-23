from django.db import migrations


PAYMENT_METHODS = [
    {
        "code": "moncash",
        "name": "MonCash",
        "is_active": True,
        "is_online": True,
        "public_config": {
            "provider": "Digicel Haiti",
            "instructions": "Envoyez le montant au numéro MonCash de l'école et fournissez la référence de transaction.",
        },
    },
    {
        "code": "natcash",
        "name": "NatCash",
        "is_active": True,
        "is_online": True,
        "public_config": {
            "provider": "Natcom Haiti",
            "instructions": "Envoyez le montant au numéro NatCash de l'école et fournissez la référence de transaction.",
        },
    },
    {
        "code": "bank_transfer",
        "name": "Virement bancaire",
        "is_active": True,
        "is_online": False,
        "public_config": {
            "instructions": "Effectuez un virement bancaire et transmettez le reçu à la comptabilité.",
        },
    },
    {
        "code": "cash",
        "name": "Espèces",
        "is_active": True,
        "is_online": False,
        "public_config": {},
    },
    {
        "code": "mobile_money",
        "name": "Mobile Money",
        "is_active": True,
        "is_online": True,
        "public_config": {},
    },
]


def seed_payment_methods(apps, schema_editor):
    PaymentMethod = apps.get_model("finance", "PaymentMethod")
    for pm in PAYMENT_METHODS:
        PaymentMethod.objects.update_or_create(
            code=pm["code"],
            defaults={
                "name": pm["name"],
                "is_active": pm["is_active"],
                "is_online": pm["is_online"],
                "public_config": pm["public_config"],
            },
        )


def remove_seeded_methods(apps, schema_editor):
    PaymentMethod = apps.get_model("finance", "PaymentMethod")
    codes = [pm["code"] for pm in PAYMENT_METHODS]
    PaymentMethod.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0004_initial"),
    ]

    operations = [
        migrations.RunPython(seed_payment_methods, remove_seeded_methods),
    ]
