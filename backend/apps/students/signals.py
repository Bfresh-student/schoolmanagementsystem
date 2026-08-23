from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Student


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_student_profile_if_needed(sender, instance, created, **kwargs):
    """
    Si un USER se voit attribuer le rle "student" et n'a pas encore
    de profil Student, on peut en crer un squelette automatiquement.
    """
    role_name = getattr(instance, "role", None)
    if role_name != "STUDENT":
        return
    # La création est orchestrée explicitement par l'API utilisateurs.
    # Un signal global rendait toute création de User(role=STUDENT)
    # impossible à compléter avec un profil Student personnalisé et créait
    # des doublons dans les flux administratifs/tests.
    return
    if Student.objects.filter(user=instance).exists():
        return
    
    # Generate unique registration number
    student_count = Student.objects.count() + 1
    reg_number = f'STU{student_count:04d}'
    
    Student.objects.create(
        user=instance,
        registration_number=reg_number,
        status='ACTIVE'
    )