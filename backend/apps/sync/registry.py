"""
Registre central des modèles "synchronisables".

Chaque app métier (grades, attendances, finance...) déclare ici comment le
moteur de sync doit traiter ses enregistrements : quel modèle cibler, quelle
combinaison de champs constitue la "clé naturelle" servant à détecter un
doublon lors d'un INSERT hors-ligne (ex: GRADES = (student_id, course_id)),
et quel champ sert de référence temporelle pour le Last-Write-Wins.

Exemple d'enregistrement, typiquement dans le `ready()` de l'AppConfig de
l'app concernée pour éviter les imports circulaires :

    # grades/apps.py
    class GradesConfig(AppConfig):
        def ready(self):
            from sync.registry import registry
            from .models import Grade
            registry.register(
                "grades",
                model=Grade,
                natural_key_fields=("student_id", "course_id"),
                timestamp_field="updated_at",
            )
"""


class SyncableModelRegistry:
    def __init__(self):
        self._registry = {}

    def register(self, table_name, *, model, natural_key_fields=(), timestamp_field="updated_at"):
        self._registry[table_name] = {
            "model": model,
            "natural_key_fields": tuple(natural_key_fields),
            "timestamp_field": timestamp_field,
        }
        return model

    def get(self, table_name):
        try:
            return self._registry[table_name]
        except KeyError:
            raise ValueError(
                f"Table '{table_name}' non enregistrée pour la synchronisation. "
                "Vérifiez que l'app correspondante appelle registry.register(...) dans son AppConfig.ready()."
            )

    def is_registered(self, table_name):
        return table_name in self._registry

    def table_names(self):
        return list(self._registry.keys())


registry = SyncableModelRegistry()
