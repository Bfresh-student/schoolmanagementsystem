from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Student


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_student_profile_if_needed(sender, instance, created, **kwargs):
    """
    Si un USER se voit attribuer le rôle "student" et n'a pas encore
    de profil Student, on peut en créer un squelette automatiquement.

    NOTE: Laissé désactivé par défaut (commenté) car dans le flux du
    Cas d'Usage 1 du document, le profil Student est généralement créé
    explicitement par l'app Inscription après approbation admin, pas
    automatiquement à la création du User. Décommenter si votre flux
    diffère.
    """
    role_name = getattr(instance, "role", None)
    if role_name != "STUDENT":
        return
    if Student.objects.filter(user=instance).exists():
        return
    # Student.objects.create(user=instance)