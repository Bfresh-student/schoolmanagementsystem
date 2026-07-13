from django.db import models
from django.utils import timezone


class AuditableMixin(models.Model):
    """
    Mixin pour tracer les modifications d'un modèle
    Ajoute automatiquement les champs de création/modification et l'auteur
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Créé le')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Modifié le')
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_%(class)s',
        verbose_name='Créé par'
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_%(class)s',
        verbose_name='Modifié par'
    )
    
    class Meta:
        abstract = True
    
    def __str__(self):
        return f"{self.__class__.__name__} ({self.created_at})"


class SyncableMixin(models.Model):
    """
    Mixin pour gérer la synchronisation offline/online
    Permet de tracker quels enregistrements ont été synchronisés
    """
    is_synced = models.BooleanField(
        default=False,
        verbose_name='Synchronisé',
        db_index=True
    )
    synced_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Synchronisé le'
    )
    sync_attempt_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Nombre de tentatives de sync'
    )
    last_sync_error = models.TextField(
        blank=True,
        verbose_name='Dernière erreur de sync'
    )
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['is_synced', '-synced_at']),
        ]
    
    def mark_as_synced(self):
        """Marquer comme synchronisé"""
        self.is_synced = True
        self.synced_at = timezone.now()
        self.sync_attempt_count = 0
        self.last_sync_error = ''
        self.save()
    
    def mark_sync_failed(self, error_message=''):
        """Marquer la synchronisation comme échouée"""
        self.is_synced = False
        self.sync_attempt_count += 1
        self.last_sync_error = error_message
        self.save()


class TimestampMixin(models.Model):
    """
    Mixin simple avec just les timestamps
    Plus léger que AuditableMixin si on n'a pas besoin de tracer l'auteur
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Créé le')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Modifié le')
    
    class Meta:
        abstract = True
        ordering = ['-created_at']


class IsActiveMixin(models.Model):
    """
    Mixin pour les modèles qui peuvent être actifs/inactifs
    Utile pour les soft deletes logiques
    """
    is_active = models.BooleanField(default=True, verbose_name='Actif', db_index=True)
    
    class Meta:
        abstract = True
    
    def deactivate(self):
        """Désactiver l'enregistrement"""
        self.is_active = False
        self.save()
    
    def activate(self):
        """Activer l'enregistrement"""
        self.is_active = True
        self.save()


class SoftDeleteMixin(models.Model):
    """
    Mixin pour implémenter un soft delete (suppression logique)
    Les enregistrements ne sont pas vraiment supprimés, juste marqués comme supprimés
    """
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='Supprimé le')
    
    class Meta:
        abstract = True
    
    @property
    def is_deleted(self):
        """Vérifier si l'enregistrement est supprimé"""
        return self.deleted_at is not None
    
    def soft_delete(self):
        """Soft delete - marquer comme supprimé"""
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        """Restaurer un enregistrement supprimé"""
        self.deleted_at = None
        self.save()


class SlugMixin(models.Model):
    """
    Mixin pour ajouter un slug auto-généré
    Utile pour les URLs lisibles
    """
    slug = models.SlugField(
        unique=True,
        verbose_name='Slug',
        db_index=True,
        help_text='Sera auto-généré à partir du titre'
    )
    
    class Meta:
        abstract = True


class PublishableMixin(models.Model):
    """
    Mixin pour les contenus publiables
    Permet de planifier la publication et la dépublication
    """
    is_published = models.BooleanField(default=False, verbose_name='Publié', db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, verbose_name='Publié le')
    publish_at = models.DateTimeField(null=True, blank=True, verbose_name='Publier le')
    unpublish_at = models.DateTimeField(null=True, blank=True, verbose_name='Dépublier le')
    
    class Meta:
        abstract = True
    
    def publish(self):
        """Publier immédiatement"""
        self.is_published = True
        self.published_at = timezone.now()
        self.publish_at = None
        self.save()
    
    def unpublish(self):
        """Dépublier"""
        self.is_published = False
        self.unpublish_at = timezone.now()
        self.save()
    
    @property
    def can_be_published(self):
        """Vérifier si le contenu peut être publié"""
        if self.publish_at and timezone.now() < self.publish_at:
            return False
        if self.unpublish_at and timezone.now() > self.unpublish_at:
            return False
        return True


class RatingMixin(models.Model):
    """
    Mixin pour ajouter un système de notation
    Suivi des notes et de la moyenne
    """
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.0,
        verbose_name='Note moyenne',
        help_text='Note de 0 à 5'
    )
    rating_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Nombre de notes'
    )
    
    class Meta:
        abstract = True
    
    def update_rating(self, new_rating):
        """Mettre à jour la moyenne des notes"""
        total = (self.rating * self.rating_count) + new_rating
        self.rating_count += 1
        self.rating = total / self.rating_count
        self.save()


class ViewCountMixin(models.Model):
    """
    Mixin pour compter les vues
    """
    view_count = models.PositiveIntegerField(default=0, verbose_name='Nombre de vues')
    
    class Meta:
        abstract = True
    
    def increment_view_count(self):
        """Incrémenter le nombre de vues"""
        self.view_count += 1
        self.save(update_fields=['view_count'])


class CommentableItem(models.Model):
    """
    Mixin pour les éléments qui peuvent recevoir des commentaires
    """
    comment_count = models.PositiveIntegerField(default=0, verbose_name='Nombre de commentaires')
    comments_enabled = models.BooleanField(default=True, verbose_name='Commentaires activés')
    
    class Meta:
        abstract = True


class FavoritableMixin(models.Model):
    """
    Mixin pour les éléments qui peuvent être favorisés
    """
    favorite_count = models.PositiveIntegerField(default=0, verbose_name='Nombre de favoris')
    
    class Meta:
        abstract = True
    
    def increment_favorite_count(self):
        """Incrémenter le nombre de favoris"""
        self.favorite_count += 1
        self.save(update_fields=['favorite_count'])
    
    def decrement_favorite_count(self):
        """Décrémenter le nombre de favoris"""
        if self.favorite_count > 0:
            self.favorite_count -= 1
            self.save(update_fields=['favorite_count'])


class SearchableMixin(models.Model):
    """
    Mixin pour les éléments searchables
    Ajoute des métadonnées pour la recherche
    """
    search_vector = models.TextField(
        blank=True,
        verbose_name='Vecteur de recherche',
        help_text='Champ technique pour la recherche FTS'
    )
    
    class Meta:
        abstract = True
    
    def update_search_vector(self, *fields):
        """Mettre à jour le vecteur de recherche"""
        self.search_vector = ' '.join(str(getattr(self, field, '')) for field in fields)
        self.save(update_fields=['search_vector'])


class VersionableMixin(models.Model):
    """
    Mixin pour les modèles versionables
    Permet de tracker les versions d'un enregistrement
    """
    version = models.PositiveIntegerField(default=1, verbose_name='Version')
    version_date = models.DateTimeField(auto_now=True, verbose_name='Date de version')
    
    class Meta:
        abstract = True
    
    def increment_version(self):
        """Incrémenter la version"""
        self.version += 1
        self.version_date = timezone.now()
        self.save(update_fields=['version', 'version_date'])


class MetadataMixin(models.Model):
    """
    Mixin pour ajouter des métadonnées JSON
    Utile pour stocker des données flexibles
    """
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Métadonnées',
        help_text='Données JSON additionnelles'
    )
    
    class Meta:
        abstract = True
    
    def set_metadata(self, key, value):
        """Définir une métadonnée"""
        if not isinstance(self.metadata, dict):
            self.metadata = {}
        self.metadata[key] = value
        self.save(update_fields=['metadata'])
    
    def get_metadata(self, key, default=None):
        """Obtenir une métadonnée"""
        if not isinstance(self.metadata, dict):
            return default
        return self.metadata.get(key, default)


class SerializableMixin(models.Model):
    """
    Mixin pour les modèles sérialisables
    Fournit une méthode to_dict() pour la sérialisation
    """
    
    class Meta:
        abstract = True
    
    def to_dict(self, fields=None, exclude=None):
        """
        Convertir l'instance en dictionnaire
        
        Args:
            fields: Liste des champs à inclure (None = tous)
            exclude: Liste des champs à exclure
        
        Returns:
            dict: Dictionnaire des données
        """
        result = {}
        opts = self._meta
        
        for f in opts.fields:
            # Vérifier les listes include/exclude
            if fields and f.name not in fields:
                continue
            if exclude and f.name in exclude:
                continue
            
            # Récupérer la valeur
            value = getattr(self, f.name)
            
            # Gérer les types spéciaux
            if hasattr(value, 'isoformat'):  # datetime
                result[f.name] = value.isoformat()
            elif isinstance(value, (list, dict)):
                result[f.name] = value
            else:
                result[f.name] = str(value) if value is not None else None
        
        return result


class CacheableMixin(models.Model):
    """
    Mixin pour les modèles cachables
    Permet de gérer le cache facilement
    """
    cache_key = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Clé de cache',
        unique=True,
        null=True
    )
    cache_valid_until = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Cache valide jusqu\'à'
    )
    
    class Meta:
        abstract = True
    
    @property
    def cache_is_valid(self):
        """Vérifier si le cache est valide"""
        if not self.cache_valid_until:
            return False
        return timezone.now() < self.cache_valid_until
    
    def invalidate_cache(self):
        """Invalider le cache"""
        self.cache_valid_until = timezone.now()
        self.save(update_fields=['cache_valid_until'])


class PriorityMixin(models.Model):
    """
    Mixin pour les modèles avec priorité
    Utile pour les files d'attente, les tâches, etc.
    """
    PRIORITY_CHOICES = [
        (1, 'Très basse'),
        (2, 'Basse'),
        (3, 'Normale'),
        (4, 'Haute'),
        (5, 'Très haute'),
    ]
    
    priority = models.PositiveIntegerField(
        choices=PRIORITY_CHOICES,
        default=3,
        verbose_name='Priorité'
    )
    
    class Meta:
        abstract = True
        ordering = ['-priority']