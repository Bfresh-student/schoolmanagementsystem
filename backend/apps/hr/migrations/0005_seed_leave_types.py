from decimal import Decimal

from django.db import migrations


def seed_leave_types(apps, schema_editor):
    LeaveType = apps.get_model("hr", "LeaveType")
    for name, days, paid in (
        ("Congé annuel", Decimal("15.00"), True),
        ("Congé maladie", Decimal("10.00"), True),
        ("Absence justifiée", Decimal("0.00"), False),
        ("Absence non justifiée", Decimal("0.00"), False),
    ):
        LeaveType.objects.get_or_create(name=name, defaults={"days_per_year": days, "is_paid": paid})


class Migration(migrations.Migration):
    dependencies = [("hr", "0004_remove_contract_teacher_remove_hrdocument_teacher_and_more")]

    operations = [migrations.RunPython(seed_leave_types, migrations.RunPython.noop)]
