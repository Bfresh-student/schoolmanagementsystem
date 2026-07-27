from django.db import migrations

# Permissions à créer: (resource, action)
PERMISSIONS = [
    ("students", "read"),
    ("students", "create"),
    ("students", "update"),
    ("students", "delete"),
    ("specializations", "read"),
    ("specializations", "create"),
    ("specializations", "update"),
    ("specializations", "delete"),
]

# Qui obtient quoi, selon la matrice RBAC du document
# (Teacher: lecture seule sur students; Admin: tout;
#  Student: lecture, restreinte à son propre profil via IsOwnerStudentOrStaff)
ROLE_ACCESS = {
    "admin": {"students": ["read", "create", "update", "delete"],
              "specializations": ["read", "create", "update", "delete"]},
    "teacher": {"students": ["read"], "specializations": ["read"]},
    "student": {"students": ["read"], "specializations": ["read"]},
}


def create_permissions(apps, schema_editor):
    Permission = apps.get_model("users", "Permission")
    Role = apps.get_model("users", "Role")

    created = {}
    for resource, action in PERMISSIONS:
        perm, _ = Permission.objects.get_or_create(resource=resource, action=action)
        created[(resource, action)] = perm

    for role_name, resources in ROLE_ACCESS.items():
        role, _ = Role.objects.get_or_create(name=role_name)
        for resource, actions in resources.items():
            for action in actions:
                role.permissions.add(created[(resource, action)])


def remove_permissions(apps, schema_editor):
    Permission = apps.get_model("users", "Permission")
    Permission.objects.filter(resource__in=["students", "specializations"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        # ⚠️ Ajuste le nom de l'app et le nom de la migration si ton app
        # "users" (celle qui contient Role/Permission) a un chemin ou un
        # label différent, ex: ("apps.users" -> label reste "users" sauf
        # si tu as défini un `label` custom dans UsersConfig).
        ("students", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_permissions, remove_permissions),
    ]
