# Structure Complète du Projet : Système de Gestion Scolaire

> Stack confirmée : **Django + DRF + Channels + Celery** (backend) / **HTML, CSS, JavaScript vanilla** (frontend) / **PostgreSQL + Redis** / **IndexedDB** pour l'offline-first.
> Organisation pensée pour un développement assisté par agents IA (Claude Code) via des **skills** dédiées par domaine.

---

## Table des Matières

1. [Vue d'ensemble de l'arborescence racine](#1-vue-densemble-de-larborescence-racine)
2. [Pourquoi séparation simple plutôt que monorepo outillé](#2-pourquoi-séparation-simple-plutôt-que-monorepo-outillé)
3. [Structure Backend (Django)](#3-structure-backend-django)
4. [Structure Frontend (Vanilla JS)](#4-structure-frontend-vanilla-js)
5. [Structure des Skills IA (.claude/skills)](#5-structure-des-skills-ia-claudeskills)
6. [Infrastructure & Déploiement](#6-infrastructure--déploiement)
7. [Documentation](#7-documentation--docs)
8. [Fichiers racine](#8-fichiers-racine)
9. [Ordre de génération recommandé](#9-ordre-de-génération-recommandé-pour-les-agents-ia)

---

## 1. Vue d'ensemble de l'arborescence racine

```
gestion-scolaire/
├── backend/                    # Django + DRF + Channels + Celery
├── frontend/                   # HTML/CSS/JS vanilla + PWA
├── .claude/                    # Configuration agents IA + skills custom
│   └── skills/
├── infra/                      # Docker, Nginx, CI/CD
├── docs/                       # Documentation technique et fonctionnelle
├── scripts/                    # Scripts d'automatisation globaux
├── .github/
│   └── workflows/              # CI/CD GitHub Actions
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
└── README.md
```

---

## 2. Pourquoi séparation simple plutôt que monorepo outillé

Tu utilises du **HTML/CSS/JS vanilla** — pas de framework avec étape de build (pas de JSX à transpiler, pas de bundle React/Vue à orchestrer). Turborepo et Nx existent pour résoudre un problème que tu n'as pas : faire tourner intelligemment des caches de build et des pipelines entre plusieurs packages JS/TS interdépendants.

Avec une séparation simple `backend/` + `frontend/` :
- Chaque agent IA travaille dans **un seul dossier à la fois**, avec un contexte clair et limité (moins de confusion, meilleure précision)
- Le `docker-compose.yml` orchestre les deux services sans outil supplémentaire
- Pas de `node_modules` à gérer côté frontend (vanilla = zéro dépendance de build), donc aucun bénéfice à un monorepo JS

**Décision retenue** : séparation simple.

---

## 3. Structure Backend (Django)

### 3.1 Vue d'ensemble

```
backend/
├── config/                          # Configuration du projet Django
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py                  # Settings communs
│   │   ├── local.py                 # Dev (SQLite, DEBUG=True)
│   │   ├── production.py            # Prod (PostgreSQL, sécurité renforcée)
│   │   └── test.py                  # Settings pour les tests
│   ├── urls.py                      # Routeur principal
│   ├── asgi.py                      # Point d'entrée ASGI (Channels)
│   ├── wsgi.py                      # Point d'entrée WSGI
│   └── celery.py                    # Configuration Celery
│
├── apps/                            # Les 15 apps métier (1 par domaine)
│   ├── users/                       # App 1 : Gestion Utilisateur
│   ├── students/                    # App 2 : Gestion Élève
│   ├── teachers/                    # App 3 : Gestion Professeur
│   ├── hr/                          # App 4 : Gestion RH
│   ├── courses/                     # App 5 : Gestion Cours
│   ├── enrollments/                 # App 6 : Gestion Inscription
│   ├── grades/                      # App 7 : Gestion Note
│   ├── attendances/                 # App 8 : Gestion Présence
│   ├── projects/                    # App 9 : Projets/Stages/Mentorat/BP
│   ├── events/                      # App 10 : Gestion Événements
│   ├── finance/                     # App 11 : Gestion Finance (factures)
│   ├── payments/                    # App 12 : Système Paiement
│   ├── media_center/                # App 13 : Media et Communication
│   ├── notifications/               # App 14 : Système Notification
│   ├── ai_insights/                 # App 15 : Gestion AI
│   └── sync/                        # App transverse : Sync Manager (queue + conflits)
│
├── core/                            # Code partagé entre apps (PAS une app Django)
│   ├── __init__.py
│   ├── permissions.py               # HasResourcePermission (RBAC générique)
│   ├── pagination.py                # Pagination DRF custom
│   ├── exceptions.py                # Exception handler global DRF
│   ├── mixins.py                    # SyncableMixin, AuditableMixin, etc.
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── audit_log.py             # AuditLogMiddleware
│   │   └── request_id.py
│   └── utils/
│       ├── __init__.py
│       ├── conflict_resolver.py     # Logique de résolution de conflits
│       └── pdf_generator.py         # Génération factures/reçus/rapports PDF
│
├── tests/                           # Tests d'intégration cross-apps
│   ├── __init__.py
│   ├── conftest.py                  # Fixtures pytest partagées
│   ├── factories/                   # factory_boy factories par modèle
│   └── integration/
│       ├── test_enrollment_to_invoice_flow.py
│       ├── test_grade_conflict_resolution.py
│       └── test_offline_sync_scenarios.py
│
├── static/                          # Fichiers statiques Django admin
├── media/                           # Uploads (dev uniquement, S3 en prod)
├── locale/                          # Traductions (fr, ht, en)
│   ├── fr/LC_MESSAGES/django.po
│   ├── ht/LC_MESSAGES/django.po
│   └── en/LC_MESSAGES/django.po
│
├── manage.py
├── pytest.ini
├── requirements/
│   ├── base.txt
│   ├── local.txt                    # + django-debug-toolbar, etc.
│   └── production.txt               # + gunicorn, etc.
└── .flake8 / pyproject.toml          # Config linting (black, isort, ruff)
```

### 3.2 Anatomie type d'une app Django (exemple : `grades/`)

Chaque app métier suit **strictement** ce même squelette, ce qui est précieux pour un agent IA : une fois le pattern appris sur une app, il se reproduit identique sur les 14 autres.

```
apps/grades/
├── __init__.py
├── apps.py                  # GradesConfig
├── models.py                 # Grade (avec champs synced, updated_at)
├── serializers.py            # GradeSerializer, GradeConflictSerializer
├── views.py                  # GradeViewSet (DRF ModelViewSet)
├── permissions.py            # Permissions spécifiques si besoin
├── urls.py                   # Router DRF local
├── signals.py                # post_save → trigger notification "Note saisie"
├── tasks.py                  # Tâches Celery (ex: notifier après sync)
├── admin.py                  # Interface Django Admin
├── filters.py                # django-filter (filtrer par student/course)
├── migrations/
│   └── __init__.py
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_serializers.py
    ├── test_views.py
    └── test_conflict_resolution.py   # Spécifique aux apps sync-critiques
```

> **Apps sync-critiques** (`grades`, `attendances`, `enrollments`, `sync`) ont en plus un fichier `conflict_handlers.py` qui implémente la logique métier de résolution de conflit propre à l'entité (ex: pour `grades`, comparer `updated_at` et proposer "local"/"remote"/"manual_merge").

### 3.3 App transverse `sync/` (le cœur offline-first)

```
apps/sync/
├── models.py              # SyncQueue, SyncOperation, LocalQueueEntry,
│                           # ConflictResolution, SyncLog
├── serializers.py
├── views.py                # SyncPushView, SyncPullView, ConflictResolveView
├── services/
│   ├── __init__.py
│   ├── queue_manager.py    # Empile/dépile les opérations
│   ├── conflict_detector.py # Détecte les conflits via timestamps
│   └── replay_engine.py    # Rejoue la queue locale vers PostgreSQL
├── consumers.py             # Django Channels : notifie en temps réel l'état du sync
├── routing.py               # Routes WebSocket
├── tasks.py                 # Celery : sync périodique, retry des échecs
└── tests/
    └── test_sync_scenarios.py   # Les 4 cas d'usage du document source
```

---

## 4. Structure Frontend (Vanilla JS)

Avec du HTML/CSS/JS pur, la discipline vient de l'**organisation des fichiers**, pas d'un framework. Voici une structure modulaire par feature, avec ES Modules natifs (`type="module"`) — pas de bundler nécessaire pour démarrer, Vite peut être ajouté plus tard uniquement comme serveur de dev si besoin (zéro changement de code).

```
frontend/
├── public/                          # Servi tel quel
│   ├── index.html                   # Page d'accueil / site public
│   ├── login.html
│   ├── manifest.json                # PWA manifest
│   ├── favicon.ico
│   └── assets/
│       ├── images/
│       └── fonts/
│
├── src/
│   ├── pages/                       # 1 dossier par page/dashboard
│   │   ├── student-dashboard/
│   │   │   ├── index.html
│   │   │   ├── dashboard.js
│   │   │   └── dashboard.css
│   │   ├── admin-dashboard/
│   │   │   ├── index.html
│   │   │   ├── dashboard.js
│   │   │   └── dashboard.css
│   │   ├── teacher-dashboard/
│   │   ├── enrollment/              # Site public d'inscription
│   │   └── auth/
│   │
│   ├── components/                  # Web Components réutilisables (Custom Elements)
│   │   ├── nav-bar/
│   │   ├── grade-table/
│   │   ├── attendance-sheet/
│   │   ├── notification-bell/
│   │   ├── conflict-resolver-modal/  # UI admin pour résoudre conflits
│   │   └── sync-status-indicator/    # Badge "En ligne / Hors ligne / Sync..."
│   │
│   ├── services/                    # Logique métier côté client
│   │   ├── api/
│   │   │   ├── client.js            # Wrapper fetch + JWT + refresh token
│   │   │   ├── grades.api.js
│   │   │   ├── attendances.api.js
│   │   │   ├── enrollments.api.js
│   │   │   └── ...                  # 1 fichier par ressource API
│   │   ├── offline/
│   │   │   ├── db.js                 # Init IndexedDB (via Dexie.js, vanilla-friendly)
│   │   │   ├── sync-engine.js         # Queue locale + replay vers backend
│   │   │   ├── conflict-handler.js
│   │   │   └── connectivity.js        # Détection online/offline
│   │   ├── auth/
│   │   │   ├── auth.service.js       # Login, logout, refresh JWT
│   │   │   └── permissions.service.js # RBAC côté client (affichage conditionnel)
│   │   └── websocket/
│   │       └── ws-client.js          # Connexion Django Channels
│   │
│   ├── store/                       # State management léger (sans Redux/Zustand)
│   │   ├── store.js                  # Pub/sub simple ou Proxy-based reactive store
│   │   └── slices/
│   │       ├── auth.store.js
│   │       ├── grades.store.js
│   │       └── sync.store.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js             # Dates, montants HTG/USD
│   │   └── constants.js
│   │
│   ├── styles/
│   │   ├── variables.css             # Design tokens (couleurs, espacements)
│   │   ├── base.css
│   │   └── layout.css
│   │
│   └── service-worker.js             # Cache assets + stratégie offline
│
├── tests/
│   ├── unit/                         # Vitest ou simple test runner natif
│   └── e2e/                          # Playwright (fonctionne très bien avec vanilla)
│
├── package.json                      # Uniquement devDependencies (Dexie, Vite optionnel, Playwright)
└── vite.config.js                    # Optionnel : juste comme serveur de dev + minifier au build
```

> **Note sur Dexie.js** : c'est une fine couche au-dessus d'IndexedDB qui reste 100% vanilla JS (pas de framework), et c'est l'équivalent direct de ce que WatermelonDB fait pour React. Elle gère les requêtes, les index, et les transactions sans imposer de paradigme.

---

## 5. Structure des Skills IA (.claude/skills)

C'est la partie qui répond directement à ton besoin : organiser le projet pour que des agents IA (Claude Code) puissent intervenir de façon fiable et reproductible, app par app.

### 5.1 Principe

Chaque skill encode le **pattern récurrent** d'un type de tâche dans ce projet précis — pas seulement "comment coder en Django" (ça, le modèle le sait déjà), mais "comment ce projet structure ses apps, ses conflits de sync, ses permissions". Une skill = un contexte que l'agent charge uniquement quand il en a besoin.

```
.claude/
├── skills/
│   ├── django-app-scaffold/
│   │   ├── SKILL.md              # Comment créer une nouvelle app suivant
│   │   │                          # le squelette standard (3.2) : models,
│   │   │                          # serializers, views, permissions...
│   │   └── assets/
│   │       └── app_template/      # Squelette de fichiers vides à copier
│   │
│   ├── sync-conflict-handler/
│   │   ├── SKILL.md              # Comment implémenter un conflict_handler.py
│   │   │                          # pour une nouvelle entité synchronisable
│   │   │                          # (cf. GRADES comme référence)
│   │   └── references/
│   │       └── conflict_patterns.md
│   │
│   ├── rbac-permissions/
│   │   ├── SKILL.md              # Comment ajouter une permission à la matrice
│   │   │                          # RBAC (Student/Teacher/Admin/Parent/HR)
│   │   └── references/
│   │       └── permission_matrix.md   # La table du document source, à jour
│   │
│   ├── offline-first-endpoint/
│   │   ├── SKILL.md              # Checklist pour qu'un endpoint DRF soit
│   │   │                          # "sync-ready" : champs synced/updated_at,
│   │   │                          # sérialisation queue-compatible, etc.
│   │   └── references/
│   │       └── checklist.md
│   │
│   ├── vanilla-js-component/
│   │   ├── SKILL.md              # Convention pour créer un nouveau
│   │   │                          # Web Component (Custom Element) cohérent
│   │   │                          # avec les autres dans src/components/
│   │   └── assets/
│   │       └── component_template/
│   │
│   ├── notification-trigger/
│   │   ├── SKILL.md              # Comment brancher un signal Django →
│   │   │                          # NOTIFICATIONS → template → canal
│   │   │                          # (reprend la table "Déclencheurs" du doc)
│   │   └── references/
│   │       └── triggers_catalog.md
│   │
│   └── audit-log-wiring/
│       ├── SKILL.md               # Comment garantir qu'une action sensible
│       │                          # (RH, suppression, résolution conflit)
│       │                          # passe par AuditLogMiddleware
│       └── references/
│           └── gdpr_checklist.md   # Droit à l'oubli, anonymisation
│
├── CLAUDE.md                       # Instructions persistantes du projet :
│                                   # stack, conventions de nommage, rappel
│                                   # des 14 apps + sync, où trouver quoi
└── settings.json                   # Config Claude Code (permissions, hooks)
```

### 5.2 Pourquoi découper les skills ainsi

- **`django-app-scaffold`** et **`vanilla-js-component`** : tu vas répéter la création d'une app/composant ~15-20 fois. Une skill garantit que l'agent ne réinvente pas un pattern légèrement différent à chaque fois.
- **`sync-conflict-handler`** et **`offline-first-endpoint`** : c'est la partie la plus risquée techniquement du projet (le document source insiste beaucoup sur les conflits de sync). Isoler cette logique dans une skill avec des références précises évite que chaque app réinvente sa propre gestion de conflit incohérente avec les autres.
- **`rbac-permissions`** et **`audit-log-wiring`** : sécurité et conformité RGPD. Ce sont des sujets où la cohérence inter-apps compte plus que la créativité — une skill avec checklist stricte est appropriée.
- **`notification-trigger`** : centralise tous les déclencheurs dispersés dans 14 apps différentes, pour qu'un agent qui ajoute un nouveau déclencheur (ex: dans `events/`) suive le même pattern que ceux déjà en place dans `grades/` ou `payments/`.

### 5.3 `CLAUDE.md` — à la racine de `.claude/`

C'est le fichier que Claude Code charge automatiquement en contexte permanent. Il devrait contenir, en bref :
- La liste des 15 apps + leur responsabilité en une ligne chacune
- Les conventions de nommage (snake_case Python, kebab-case fichiers JS/CSS)
- Le rappel "toute entité synchronisable DOIT avoir `synced`, `created_at`, `updated_at`"
- Les commandes utiles (`make test`, `make migrate`, `make seed`)
- Un lien vers `docs/architecture/` pour le détail

---

## 6. Infrastructure & Déploiement

```
infra/
├── docker/
│   ├── backend/
│   │   ├── Dockerfile
│   │   └── Dockerfile.prod
│   ├── frontend/
│   │   └── Dockerfile               # Nginx servant les fichiers statiques
│   └── nginx/
│       ├── nginx.conf
│       └── conf.d/
│           └── default.conf
│
├── docker-compose.override.yml      # Overrides dev local (hot-reload, volumes)
│
└── deploy/
    ├── render.yaml                  # Si déploiement Render
    ├── digitalocean-app.yaml        # Si DigitalOcean App Platform
    └── terraform/                   # Si infra-as-code AWS (optionnel, plus tard)
```

```
.github/
└── workflows/
    ├── backend-tests.yml             # pytest sur chaque PR
    ├── frontend-tests.yml            # Playwright sur chaque PR
    ├── lint.yml                      # black, isort, ruff, eslint
    └── deploy.yml                    # Déploiement sur merge main
```

---

## 7. Documentation (`docs/`)

```
docs/
├── architecture/
│   ├── ANALYSE_SYSTEME_GESTION_SCOLAIRE.md   # Le document source (déplacé ici)
│   ├── erd-diagrams/                          # Exports visuels des ERD par groupe
│   └── decisions/                              # ADR (Architecture Decision Records)
│       ├── 001-vanilla-js-vs-framework.md
│       ├── 002-indexeddb-vs-watermelondb.md
│       └── 003-separation-simple-vs-monorepo.md
│
├── api/
│   └── openapi.yaml                  # Généré via drf-spectacular
│
├── sync/
│   └── conflict-resolution-guide.md  # Guide pour les admins qui résolvent
│                                      # des conflits manuellement
│
└── onboarding/
    └── setup-local.md                # Comment lancer le projet en local
```

---

## 8. Fichiers racine

| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Orchestration dev : backend, frontend (Nginx statique ou live-server), PostgreSQL, Redis, Celery worker, Celery beat |
| `docker-compose.prod.yml` | Variante prod (sans debug, avec Gunicorn, healthchecks) |
| `Makefile` | Raccourcis : `make up`, `make migrate`, `make test`, `make seed`, `make shell` |
| `.env.example` | Toutes les variables d'env nécessaires, sans valeurs sensibles |
| `.gitignore` | Python, Node, IDE, `.env`, `media/`, `staticfiles/` |
| `README.md` | Vue d'ensemble + lien vers `docs/onboarding/setup-local.md` |

---

## 9. Ordre de génération recommandé (pour les agents IA)

Pour que les agents construisent le projet sans dépendances cassées, dans cet ordre :

1. **Squelette racine** : `docker-compose.yml`, `.env.example`, `Makefile`, `.claude/CLAUDE.md`
2. **Backend foundation** : `config/` (settings), puis app `users/` (tout dépend d'elle)
3. **Skill `django-app-scaffold`** : créée tôt, puis réutilisée pour générer `students/`, `teachers/`, `courses/` (apps de référence, peu de logique de sync)
4. **Apps sync-critiques** : `grades/`, `attendances/`, `enrollments/` + app transverse `sync/` (en s'appuyant sur la skill `sync-conflict-handler`)
5. **Finance** : `finance/` → `payments/` (dépend des enrollments)
6. **Reste des apps** : `hr/`, `projects/`, `events/`, `media_center/`, `notifications/`, `ai_insights/`
7. **Frontend** : `auth/` → `student-dashboard/` → `admin-dashboard/` → `teacher-dashboard/`, en parallèle des endpoints backend correspondants
8. **Offline engine frontend** : `services/offline/` une fois que les endpoints de sync backend sont stables
9. **CI/CD + déploiement** en dernier, une fois qu'il y a quelque chose à déployer

Cet ordre respecte les dépendances réelles entre apps identifiées dans le document source (`USERS` est la fondation, `GRADES`/`ATTENDANCES` sont les plus risquées techniquement, `AI` et `paiements en ligne` sont les derniers car ils dépendent de tout le reste et sont explicitement "impossible offline").

---

**Prochaine étape suggérée** : si tu veux, je peux générer le contenu réel des premiers fichiers (ex: `.claude/CLAUDE.md`, la skill `django-app-scaffold` complète, ou le `docker-compose.yml`) pour démarrer concrètement.
