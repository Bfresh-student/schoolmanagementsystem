import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.teachers.models import Teacher
from apps.students.models import Specialization
from apps.courses.models import Course
from decimal import Decimal

User = get_user_model()

coursCEJEC = [
    'Entrepreneuriat', 'Plan d\'Affaires', 'Sociologie de la pratique des affaires', 
    'Éducation à la technologie', 'Développement personnel', 'Marketing', 
    'Droit des affaires', 'Les lois du succès', 'Gestion des ressources humaines', 
    'Leadership', 'Correspondance administrative', 'Art oratoire'
]

profsCEJEC = [
    'Dr. Jacques Mentor', 'Prof. Jean Baptiste', 'Prof. Rose Michel', 
    'Dr. Marc Arthur', 'Prof. Marie Louis', 'Prof. Carline Étienne', 
    'Prof. Pierre Antoine', 'Prof. Nathalie Pierre', 'Prof. André Simon', 
    'Prof. Isabelle Martin', 'Prof. David Roche', 'Prof. Claire Fontaine'
]

def run():
    print("Seeding Phase 3 Academic Modules data...")

    # 1. Create Users and Teachers
    teachers_dict = {}
    for prof_name in profsCEJEC:
        # Create a dummy user
        email = f"{prof_name.replace(' ', '.').replace('Dr.', 'dr').replace('Prof.', 'prof').lower()}@cejec.edu.ht"
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': prof_name.split(' ')[0],
                'last_name': ' '.join(prof_name.split(' ')[1:]),
                'role': 'TEACHER'
            }
        )
        if created:
            user.set_password('password123')
            user.save()
        
        teacher, _ = Teacher.objects.get_or_create(user=user)
        teachers_dict[prof_name] = teacher
        print(f"Teacher {prof_name} ready.")

    # 2. Create Specialization (Classe)
    spec_name = 'Formation Professionnelle - Entrepreneuriat'
    spec, _ = Specialization.objects.get_or_create(
        name=spec_name,
        defaults={'description': 'Classe d\'Entrepreneuriat par défaut'}
    )
    print(f"Specialization {spec.name} ready.")

    # 3. Create Courses (Subjects) and assign Teachers
    # To map to the frontend:
    # {cours: 'Entrepreneuriat', professeur: 'Dr. Jacques Mentor'}
    cours_profs_mapping = list(zip(coursCEJEC, profsCEJEC))
    
    for cours_name, prof_name in cours_profs_mapping:
        code = f"CEJEC-{cours_name[:4].upper()}"
        course, _ = Course.objects.get_or_create(
            code=code,
            defaults={
                'name': cours_name,
                'specialization': spec,
                'teacher': teachers_dict[prof_name],
                'duration_weeks': 12,
                'capacity_max': 50,
                'fees_amount': Decimal("100.00"),
                'status': 'active'
            }
        )
        # update if existing
        course.name = cours_name
        course.specialization = spec
        course.teacher = teachers_dict[prof_name]
        course.save()
        print(f"Course {cours_name} assigned to {prof_name} ready.")
        
    print("Seeding finished.")

if __name__ == '__main__':
    run()
