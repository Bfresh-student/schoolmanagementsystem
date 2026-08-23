from django.core.management.base import BaseCommand
from apps.students.models import Specialization, SchoolClass
from apps.courses.models import Course
 
 
# --- Filières : nom -> description ---
FILIERES = [
    ("Entrepreneuriat", "Formation en entrepreneuriat"),
    ("Informatique", "Formation en informatique"),
    ("Gestion", "Formation en gestion"),
    ("Comptabilité", "Formation en comptabilité"),
    ("Marketing", "Formation en marketing"),
    ("Leadership", "Formation en leadership"),
    ("Droit des Affaires", "Formation en droit des affaires"),
    ("GRH", "Gestion des ressources humaines"),
    ("Commerce International", "Formation en commerce international"),
]
 
# --- Classes/niveaux par filière ---
CLASSES = {
    "Entrepreneuriat": [1, 2, 3,4,5,6],
    "Informatique": [1, 2, 3],
    "Gestion": [1, 2],
    "Comptabilité": [1, 2],
    "Marketing": [1, 2],
    "Leadership": [1, 2],
    "Droit des Affaires": [1],
    "GRH": [1],
    "Commerce International": [1],
}
 
# --- Cours de base (exemples, à assigner ensuite via l'interface) ---
COURSES = [
    "Entrepreneuriat", "Plan d'Affaires", "Sociologie des Affaires",
    "Éducation Technologique", "Développement Personnel", "Marketing",
    "Droit des Affaires", "Lois du Succès", "GRH", "Leadership",
    "Correspondance Admin", "Art Oratoire",
]
 
 
class Command(BaseCommand):
    help = "Crée les filières, classes/niveaux et cours de base pour CEJEC (idempotent)."
 
    def handle(self, *args, **options):
        specs_by_name = {}
 
        self.stdout.write(self.style.MIGRATE_HEADING("Filières"))
        for name, description in FILIERES:
            spec, created = Specialization.objects.get_or_create(
                name=name,
                defaults={"description": description, "is_active": True},
            )
            specs_by_name[name] = spec
            self._log(created, "filière", spec.name)
 
        self.stdout.write(self.style.MIGRATE_HEADING("Classes / Niveaux"))
        for filiere_name, levels in CLASSES.items():
            spec = specs_by_name.get(filiere_name)
            if not spec:
                self.stdout.write(self.style.WARNING(f"  Filière introuvable pour: {filiere_name}"))
                continue
            for level in levels:
                cls, created = SchoolClass.objects.get_or_create(
                    specialization=spec,
                    level=level,
                    defaults={"name": f"{filiere_name} {level}"},
                )
                self._log(created, "classe", cls.name)
 
        self.stdout.write(self.style.MIGRATE_HEADING("Cours (exemples, sans filière assignée)"))
        for course_name in COURSES:
            course, created = Course.objects.get_or_create(
                name=course_name,
                defaults={
                    "code": f"CEJEC-{course_name[:6].upper().replace(' ', '')}",
                    "duration_weeks": 12,
                    "capacity_max": 30,
                    "fees_amount": "100.00",
                    "status": "active",
                },
            )
            self._log(created, "cours", course.name)
 
        self.stdout.write(self.style.SUCCESS("\\nSeed terminé."))
 
    def _log(self, created, label, name):
        prefix = self.style.SUCCESS("✓ Créé") if created else self.style.WARNING("· Existe déjà")
        self.stdout.write(f"  {prefix} — {label}: {name}")