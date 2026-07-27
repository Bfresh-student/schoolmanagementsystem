# App `sync` — Intégration

Moteur générique d'offline-first : reçoit le batch d'opérations en attente
d'un client (WatermelonDB), détecte les conflits par table via un
**registre de modèles synchronisables**, et journalise tout pour audit.

## 1. Installation

```bash
cp -r sync/ <racine_du_projet>/
```

## 2. `settings.py`

```python
INSTALLED_APPS = [
    # ...
    "rest_framework",
    "sync",
    "grades",         # doit s'enregistrer dans son AppConfig.ready()
    "attendances",    # idem
    "finance",        # idem, pour les paiements espèces saisis hors-ligne
]

CELERY_BEAT_SCHEDULE = {
    "sync-retry-failed": {
        "task": "sync.tasks.retry_failed_operations",
        "schedule": crontab(minute="*/15"),
    },
    "sync-alert-stale-conflicts": {
        "task": "sync.tasks.alert_stale_conflicts",
        "schedule": crontab(hour=8, minute=0),
    },
    "sync-purge-old-logs": {
        "task": "sync.tasks.purge_old_sync_logs",
        "schedule": crontab(hour=3, minute=0, day_of_week=0),
    },
}
```

## 3. `urls.py` du projet

```python
urlpatterns = [
    path("api/sync/", include("sync.urls")),
]
```

## 4. Enregistrer un modèle comme synchronisable

Chaque app métier déclare comment le moteur doit la traiter, dans son
`AppConfig.ready()` (jamais au niveau module, pour éviter les imports
circulaires au démarrage de Django) :

```python
# grades/apps.py
class GradesConfig(AppConfig):
    name = "grades"

    def ready(self):
        from sync.registry import registry
        from .models import Grade
        registry.register(
            "grades",
            model=Grade,
            natural_key_fields=("student_id", "course_id"),  # cf. UK du doc
            timestamp_field="updated_at",
        )
```

```python
# attendances/apps.py
def ready(self):
    from sync.registry import registry
    from .models import Attendance
    registry.register(
        "attendances",
        model=Attendance,
        natural_key_fields=("student_id", "course_id", "attendance_date"),
        timestamp_field="updated_at",
    )
```

## 5. Côté client (WatermelonDB)

À la reconnexion, envoyer :

```json
POST /api/sync/batch/
{
  "queue_name": "salle-informatique-1",
  "entries": [
    {
      "table_name": "grades",
      "action": "create",
      "data": {"student_id": 42, "course_id": 7, "grade": 16, "teacher_id": 3},
      "local_timestamp": "2026-07-10T14:30:00Z",
      "client_operation_id": "a1b2c3..."
    }
  ]
}
```

`client_operation_id` (UUID généré côté client) est la clé d'idempotence :
si la requête est renvoyée après une coupure réseau, l'opération n'est
jamais rejouée deux fois.

Réponse : un statut par entrée (`synced`, `conflict`, `failed`) avec le
`record_id` définitif à répercuter dans la base locale.

## Ce que couvre l'app

| Fichier | Rôle |
|---|---|
| `registry.py` | Registre des modèles synchronisables (table → modèle, clé naturelle, champ timestamp) |
| `models.py` | `SyncQueue`, `SyncOperation`, `LocalQueueEntry`, `ConflictResolution`, `SyncLog` |
| `services.py` | `SyncProcessor` — détection de conflit (doublon, suppression distante, version différente) + résolution manuelle |
| `views.py` | `POST /batch/` (client), `conflicts/{id}/resolve/`, lecture des queues et logs (admin) |
| `tasks.py` | Retry des échecs techniques, alerte conflits oubliés, purge des vieux logs |
| `admin.py` | Résolution de conflit en masse (garder local / garder distant) depuis l'admin |

## Logique de conflit reprise de l'analyse

| Cas | Détection | Résultat |
|---|---|---|
| INSERT, aucun enregistrement existant avec la même clé naturelle | — | Appliqué directement, `synced` |
| INSERT, un enregistrement existe déjà avec la même clé naturelle | `duplicate_natural_key` | Conflit, admin choisit |
| UPDATE/DELETE, `record_id` introuvable côté serveur | `deleted_remotely` | Conflit, admin choisit |
| UPDATE/DELETE, le serveur a été modifié après le snapshot local | `version_mismatch` | Conflit, admin choisit |
| UPDATE/DELETE, rien n'a changé côté serveur depuis le snapshot local | — | Appliqué directement, `synced` |

Le principe **Queue + Conflict Detection** retenu dans l'analyse est donc
respecté : aucune perte de donnée, aucune résolution automatique à
l'aveugle — un conflit reste `pending` tant qu'un admin n'a pas tranché.
