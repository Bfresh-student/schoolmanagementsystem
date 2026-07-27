# App `hr` — Intégration

## Fichiers fournis

```
hr/
├── __init__.py
├── apps.py
├── models.py           # LeaveType, Contract, Salary, Leave, PerformanceEvaluation, HRDocument, AuditLog
├── admin.py
├── permissions.py       # IsHRStaff, IsHRStaffOrOwnerReadOnly
├── serializers.py
├── views.py             # ViewSets DRF + AuditLogMixin
├── urls.py
├── tasks.py             # Jobs Celery beat (documents/contrats expirants)
├── tests.py             # squelette de tests, à compléter avec tes factories
└── migrations/
    └── __init__.py
```

## Étapes d'intégration

1. **Copier le dossier** `hr/` à la racine de ton projet Django (à côté de `teachers/`, `users/`, etc.).

2. **Ajuster les FK string** dans `models.py` si tes apps ne s'appellent pas exactement `teachers` :
   ```python
   teacher = models.ForeignKey("teachers.Teacher", ...)
   ```

3. **Ajouter l'app** dans `INSTALLED_APPS` (settings.py) :
   ```python
   INSTALLED_APPS = [
       ...,
       "hr",
   ]
   ```

4. **Monter les URLs** dans le `urls.py` racine :
   ```python
   path("api/hr/", include("hr.urls")),
   ```

5. **Générer et appliquer les migrations** :
   ```bash
   python manage.py makemigrations hr
   python manage.py migrate
   ```

6. **Rôles requis** : le code suppose `request.user.role.name` avec au moins les
   valeurs `"admin"`, `"hr"`, `"teacher"`. Si ton modèle de rôle est structuré
   différemment, adapte `hr/permissions.py::_role_name`.

7. **Lien Teacher → User** : les vues supposent `teacher.user_id` et
   `request.user.teacher` (related_name inverse). Si ton modèle `Teacher`
   utilise un nom différent pour la relation OneToOne vers `User`, ajuste
   `hr/views.py::TeacherScopedQuerysetMixin` et `LeaveViewSet.balance`.

8. **Notifications** : `hr/tasks.py::send_hr_notification` est un
   placeholder. Branche-le sur ton app Notification existante
   (`NOTIFICATIONS` / `NOTIFICATION_QUEUE` du document d'analyse).

9. **Celery beat** : ajoute les 3 tâches de `tasks.py` à
   `CELERY_BEAT_SCHEDULE` (exemple donné en commentaire en tête du fichier).

10. **Chiffrement au repos** (recommandé, cf. spec) : si tu utilises déjà un
    champ chiffré ailleurs dans le projet (ex. `django-cryptography` ou
    équivalent), applique-le à `Contract.monthly_salary` et
    `Salary.net_salary` — non inclus ici pour rester compatible avec
    n'importe quel choix de lib déjà fait dans ton projet.

## Décisions prises (rappel de la spec)

- **Pas de sync offline** pour cette app : toute écriture nécessite une connexion.
  Les lectures (solde de congés, contrat, bulletins) peuvent être mises en
  cache côté client en lecture seule.
- **Admin et HR ont les mêmes droits** par défaut (`HR_STAFF_ROLES` dans
  `permissions.py`). Pour séparer les deux rôles strictement, retire
  `"admin"` de cet ensemble et gère les cas particuliers un par un.
- **AuditLog est obligatoire**, pas optionnel : toutes les écritures passent
  par `AuditLogMixin`, pas de bypass silencieux.
