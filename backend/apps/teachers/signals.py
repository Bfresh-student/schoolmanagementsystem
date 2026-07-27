# ========== SIGNALS.PY CORRIGÉ ==========

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models import User
from .models import Teacher


@receiver(post_save, sender=User)
def create_teacher_profile(sender, instance, created, **kwargs):
    """
    Créer automatiquement un profil professeur si le rôle est TEACHER
    
    NOTE: 
    - Utilise created=True pour éviter les mises à jour
    - Utilise get_or_create pour éviter les doublons
    - Désactiver ce signal dans les tests si nécessaire avec @pytest.mark.disable_signals
    """
    if created and instance.role == 'TEACHER':
        # Générer un ID unique pour le professeur
        teacher_count = Teacher.objects.count() + 1
        teacher_id = f'T{teacher_count:04d}'
        
        # get_or_create évite les doublons si le signal s'exécute plusieurs fois
        Teacher.objects.get_or_create(
            user=instance,
            defaults={
                'teacher_id': teacher_id,
                'status': 'ACTIVE'
            }
        )