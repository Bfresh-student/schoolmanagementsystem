# Analyse Complète : Système de Gestion Scolaire Professionnel

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack Technologique](#stack-technologique)
3. [Architecture Générale](#architecture-générale)
4. [Les 14 Applications](#les-14-applications)
5. [Modèles de Données (ERD)](#modèles-de-données)
6. [Synchronisation Offline-First](#synchronisation-offline-first)
7. [Dépendances entre Applications](#dépendances-entre-applications)
8. [Cas d'Usage](#cas-dusage)
9. [Sécurité et Permissions](#sécurité-et-permissions)

---

## Vue d'ensemble

### Contexte

- **Type d'école** : École professionnelle (formation continue, stages, projets)
- **Environnement** : Fonctionne en **local** (réseau interne, pas d'internet) ET en **ligne** (accès cloud)
- **Enjeu** : Synchroniser les données entre local et cloud sans perte ni corruption

### Besoins Clés

✅ Site public avec inscription  
✅ Dashboard étudiant (notes, présences, projets)  
✅ Dashboard administrateur (gestion complète)  
✅ Fonctionnement offline-first  
✅ Synchronisation intelligente des données  
✅ Notifications et communication  
✅ Gestion financière et paiements  
✅ Intelligence artificielle pour prédictions  

---

## Stack Technologique

### Backend

- **Framework** : Django 4.2+
- **API REST** : Django REST Framework
- **WebSocket** : Django Channels (temps réel)
- **Async Tasks** : Celery + Redis
- **Authentification** : JWT (djangorestframework-simplejwt)

### Frontend

- **Framework** : React ou Vue.js
- **Offline-First** : WatermelonDB (SQLite local)
- **State Management** : Redux Toolkit ou Zustand
- **Synchronisation** : TanStack Query
- **PWA** : Service Workers

### Base de Données

- **Production** : PostgreSQL (cloud)
- **Développement** : SQLite
- **Cache/Sessions** : Redis
- **Local** : SQLite (WatermelonDB)

### Déploiement

- **Conteneurisation** : Docker + Docker Compose
- **Reverse Proxy** : Nginx
- **Hosting** : AWS / DigitalOcean / Render
- **CI/CD** : GitHub Actions

---

## Architecture Générale

### Flux de Données

```
┌─────────────────────────────────────────────────┐
│   FRONTEND (Vanilla+ WatermelonDB)           │
│  ┌─────────────────────────────────────────┐   │
│  │ Service Workers (offline support)       │   │
│  │ Redux/Zustand (state)                   │   │
│  │ TanStack Query (sync manager)           │   │
│  │ WatermelonDB (SQLite local)             │   │
│  └─────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTP/WebSocket
                  │
┌─────────────────▼───────────────────────────────┐
│   BACKEND (Django)                              │
│  ┌─────────────────────────────────────────┐   │
│  │ Django REST Framework (API)             │   │
│  │ Django Channels (WebSocket)             │   │
│  │ Celery (async tasks)                    │   │
│  │ Sync Manager (queue + conflict detection)   │
│  └─────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   DATABASE LAYER                                │
│  ┌─────────────────────────────────────────┐   │
│  │ PostgreSQL (source de vérité)           │   │
│  │ Redis (cache + sessions)                │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Modes de Fonctionnement

**Mode 1 : Offline (Pas d'Internet)**
- Toutes les données lues depuis SQLite local
- Actions saisies dans queue locale
- UI responsive (pas d'attente réseau)

**Mode 2 : Online (Internet OK)**
- Données synchronisées avec PostgreSQL
- Actions envoyées immédiatement
- Notifications et mises à jour en temps réel

**Mode 3 : Hybrid (Transition)**
- Queue locale jouée vers PostgreSQL
- Conflits détectés et remontés à l'admin
- Résolution manuelle ou automatique

---

## Les 14 Applications

### Groupe 1 : Gestion Administrative (Core)

#### 1. **Gestion Utilisateur**
**Rôle** : Foundation pour tout le système

**Entités principales** :
- `USERS` : Compte unique (email, password, statut)
- `ROLES` : Student, Teacher, Admin, Parent, HR
- `PERMISSIONS` : Qui peut faire quoi sur quelle ressource

**Relations critiques** :
- 1 User → 1 Role (généralement)
- 1 Role → N Permissions

**Enjeux** :
- Authentification doit fonctionner en local (JWT avec expiration différée)
- Permissions basées sur rôles (role-based access control)

---

#### 2. **Gestion Élève**
**Rôle** : Profil de l'étudiant

**Entités principales** :
- `STUDENTS` : Infos complètes (nom, prénom, n° inscription, spécialisation)
- Lié à `USERS` (1:1)

**Données sensibles** :
- Date de naissance
- Adresse
- Contacts d'urgence
- État d'avancement (actif, suspendu, diplômé)

**Synchronisation** :
- Informations peu modifiées → one-way sync acceptable
- Mais s'il y a conflit (même étudiant, infos différentes) → merge intelligent

---

#### 3. **Gestion Professeur**
**Rôle** : Profil et historique des formateurs

**Entités principales** :
- `TEACHERS` : Infos (qualification, date d'embauche, spécialité)
- Lié à `USERS` (1:1)

**Responsabilités** :
- Enseigne des cours
- Saisit notes et présences
- Mentor pour projets/stages

**Dépendance RH** :
- Contrat, salaire, congés gérés en HR

---

#### 4. **Gestion RH** (Optionnel pour petites écoles)
**Rôle** : Gestion des ressources humaines

**Données sensibles** :
- `CONTRACTS` : Contrats d'emploi
- `SALARIES` : Paies mensuelles
- `LEAVES` : Congés demandés/approuvés
- `PERFORMANCE_EVALUATIONS` : Évaluations
- `AUDIT_LOG` : Qui a fait quoi, quand

**Enjeu Offline** :
- ❌ **Impossible offline** : données trop sensibles
- Accès restreint (admins uniquement)

---

### Groupe 2 : Gestion Pédagogique

#### 5. **Gestion Cours**
**Rôle** : Catalogue des formations

**Entités principales** :
- `COURSES` : Code, nom, durée, spécialisation
- `SPECIALIZATIONS` : Filières (Informatique, Commerce, etc.)

**Relations** :
- 1 Specialization → N Courses
- 1 Course → 1 Teacher (responsable)
- 1 Course → N Inscriptions

**Enjeu Offline** :
- Données de **référence** (peu modifiées)
- Solution : **one-way sync** (cloud → local au démarrage)
- Modifications seulement en ligne

---

#### 6. **Gestion Inscription**
**Rôle** : Processus d'enrôlement

**Entités principales** :
- `INSCRIPTIONS` : Lien Student ↔ Course

**État d'une inscription** :
```
pending → approved → active → suspended (optionnel) → validated
```

**Relations critiques** :
- INSCRIPTIONS → STUDENTS (qui s'inscrit)
- INSCRIPTIONS → COURSES (à quel cours)
- INSCRIPTIONS → INVOICES (génère une facture)

**Enjeu Synchronisation** :
- Inscription peut être créée localement (admin approuve offline)
- À la reconnexion → facture auto-générée
- Notification envoyée à l'étudiant

---

#### 7. **Gestion Note**
**Rôle** : Évaluation des apprentissages

**Entités principales** :
- `GRADES` : Note pour Student dans un Course

**Champ critique** :
```
GRADES (student_id, course_id) = UNIQUE
  → Impossible d'avoir 2 notes pour la même combinaison
```

**Métadonnées essentielles** :
- `grade` : Valeur (0-20)
- `date_graded` : Quand saisie
- `teacher_id` : Qui a saisi
- `synced` : Envoyée au serveur ?
- `created_at`, `updated_at` : Timestamps pour conflits

**Enjeu Synchronisation CRITIQUE** :
```
Scénario : 2 personnes saisissent une note pour le même étudiant-cours

Prof A (offline) : saisit 16
Admin B (online) : saisit 14

À la sync :
  → Détection conflit (2 notes pour même étudiant-cours)
  → Comparaison timestamps
  → Admin résout : garde "16" ou "14" ?
  → Log de la décision (audit trail)
```

**Solution** :
- `CONFLICT_RESOLUTION.resolution_choice` : "local", "remote", ou "manual_merge"
- `AUDIT_LOG` : Trace complète pour justifier

---

#### 8. **Gestion Présence**
**Rôle** : Appel de classe et suivi des absences

**Entités principales** :
- `ATTENDANCES` : Présence/absence d'un Student dans un Course à une date

**Champ critique** :
```
ATTENDANCES (student_id, course_id, attendance_date) = UNIQUE
  → Impossible d'avoir 2 appels le même jour
```

**Métadonnées** :
- `present` : Boolean (vrai/faux)
- `reason_if_absent` : Texte optionnel
- `synced` : Envoyée ?
- `created_at`, `updated_at` : Timestamps

**Enjeu Offline** :
- Professeur fait l'appel EN LOCAL
- 30 étudiants = 30 × ATTENDANCES INSERT
- À la reconnexion → tous les 30 synced

**Enjeu Paiement** :
- Absences → retenues possibles
- Lien : ATTENDANCES → INVOICES (ajustement de tarif)

---

### Groupe 3 : Gestion Projets et Expériences

#### 9. **Gestion Projet, Stages, Mentorat, Business Plan**
**Rôle** : Suivi de 4 sous-modules

**9a. Projets Pédagogiques**
- `PROJECTS` : Projet group
- `PROJECT_MEMBERS` : Qui participe
- `PROJECT_DELIVERABLES` : Rendus (avec dates, fichiers, notes)

**9b. Stages Professionnels**
- `INTERNSHIPS` : Stage en entreprise
- `COMPANIES` : Entreprises hôtes
- `INTERNSHIP_LOGS` : Journal quotidien du stage

**9c. Mentorat**
- `MENTORSHIP` : Relation Student ↔ Teacher
- `MENTORSHIP_SESSIONS` : Séances (date, notes, feedback)

**9d. Business Plan**
- `BUSINESS_PLANS` : Projet entrepreneur
- `BUSINESS_PLAN_PRESENTATIONS` : Présentation et évaluation

**Relations communes** :
- Student → Project/Internship/Mentorship/BusinessPlan
- Teacher → supervise/mentor
- Évaluation → note finale

**Enjeu Offline** :
- Suivi du projet = documents (PDF, images)
- Solution : **Lazy sync** (télécharger documents à la demande)
- Pas de sync automatique des gros fichiers

---

#### 10. **Gestion Événements**
**Rôle** : Événementiel scolaire

**Types d'événements** :
- Conférences
- Formations
- Cérémonies
- Réunions
- Webinaires
- Ateliers

**Entités** :
- `EVENTS` : Événement (nom, date, lieu, capacité)
- `EVENT_PARTICIPANTS` : Qui s'inscrit/assiste
- `EVENT_MEDIA` : Photos/vidéos

**Enjeu** :
- Gestion de capacité (50 places max)
- Notifications d'inscription
- Stockage média (cloud S3)

---

### Groupe 4 : Gestion Financière

#### 11. **Gestion Finance**
**Rôle** : Facturation et budgets

**Entités principales** :
- `INVOICES` : Facture (générée à l'inscription)
- `RECEIPT` : Reçu (après paiement)

**Pipeline** :
```
INSCRIPTION créée
  → INVOICE auto-générée
  → Étudiant voit facture en app
  → Paie via Paiement
  → Facture marquée "paid"
  → Reçu généré (PDF)
```

**Métadonnées** :
- `invoice_number` : Numéro unique
- `amount` : Montant dû
- `status` : pending, paid, overdue, cancelled
- `due_date` : Échéance

---

#### 12. **Système Paiement**
**Rôle** : Traitement des paiements

**Gateways supportés** :
- Stripe (cartes de crédit)
- PayPal
- Mobile Money (Digicel, MTN - pour Haïti)
- Virement bancaire manuel
- Paiement en espèces (en personne)

**Entités** :
- `PAYMENTS` : Enregistrement du paiement
- `PAYMENT_METHODS` : Configuration gateways

**Flux** :
```
Facture → Lien de paiement généré
       → Étudiant clique
       → Redirection Stripe/PayPal
       → Paiement confirmé
       → Webhook reçu (backend)
       → PAYMENTS.status = "completed"
       → Email confirmation
```

**Enjeu Offline** :
- ❌ **Impossible offline** : paiement = nécessite connexion
- Local : affiche "Attendre connexion pour payer"

---

### Groupe 5 : Communication et Support

#### 13. **Gestion Media et Communication**
**Rôle** : Partage de ressources et annonces

**Sous-modules** :

**A. Galerie Media**
- `MEDIA_FOLDERS` : Organisation hiérarchique
- `MEDIA_FILES` : Photos, vidéos, documents
- Stockage cloud (AWS S3)

**B. Annonces/Actualités**
- `ANNOUNCEMENTS` : News de l'école
- `ANNOUNCEMENT_RECIPIENTS` : Qui l'a lue
- Archivées

**C. Partage de Ressources**
- Matériel pédagogique par professeur
- Syllabus des cours
- Exercices

**Enjeu Offline** :
- Documents volumineux (vidéos)
- Pas de sync automatique
- Télécharger à la demande (Lazy sync)

---

#### 14. **Système Notification**
**Rôle** : Communication en temps réel

**Canaux** :
- Email
- SMS (optionnel)
- Push notifications (app mobile)
- Dashboard (in-app)

**Déclencheurs** :
```
Inscription approuvée → Email bienvenue
Note saisie → Notification "Votre note: 16/20"
Absence enregistrée → Email au parent
Facture générée → Notification de paiement dû
Paiement reçu → Email confirmation
Événement créé → Notification aux participants
```

**Entités** :
- `NOTIFICATIONS` : Notification (quoi, pour qui)
- `NOTIFICATION_QUEUE` : Queue d'envoi
- `NOTIFICATION_PREFERENCES` : Préférences utilisateur
- `NOTIFICATION_TEMPLATES` : Templates (sujets, corps)

**Enjeu Offline** :
- Notifications queued en local
- Envoyées au reconnexion
- ❌ Email hors ligne impossible

---

### Groupe 6 : Intelligence Artificielle

#### 15. **Gestion AI**
**Rôle** : Analytics et prédictions

**Cas d'usage** :

**A. Prédiction de Performance**
- Analyser notes + présences → prédire résultat final
- Alerte pour élèves à risque (dropout risk)

**B. Recommandations Pédagogiques**
- "Cet élève a des difficultés en Maths" → suggérer tutorat
- "Bonnes résultats" → encourager projets avancés

**C. Optimisation des Groupes**
- Former groupes de projets équilibrés
- Éviter incompatibilités

**D. Détection d'Anomalies**
- Absence anormale → alerte
- Changement brutal de notes → investigation

**E. Chatbot Support**
- Questions fréquentes (inscription, paiement)
- Résolution automatique

**F. Génération de Rapports**
- Résumés automatiques des performances
- Statistiques par classe/spécialisation

**Données nécessaires** :
- Notes historiques
- Présences
- Données démographiques (anonymisées)
- Logs d'activité

**Enjeu Offline** :
- ❌ **Impossible offline** : AI = cloud
- Résultats cachés en offline, visibles online

**Éthique** :
- Biais algorithmiques ?
- Données confidentielles
- RGPD compliance

---

## Modèles de Données (ERD)

### Légende

```
1:1 = One-to-one (une seule relation)
1:N = One-to-many (une à plusieurs)
N:M = Many-to-many (plusieurs à plusieurs)
PK = Primary Key (identifiant unique)
FK = Foreign Key (référence à une autre table)
UK = Unique constraint (valeur unique)
```

---

### App 1 : Gestion Utilisateur

```
USERS
├─ id (PK)
├─ email (UK) → Identifiant unique
├─ password_hash
├─ first_name
├─ last_name
├─ phone
├─ is_verified
├─ is_active
├─ created_at
└─ updated_at
    ↓ 1:N
    ROLES
    ├─ id (PK)
    ├─ name (UK) → "student", "teacher", "admin"
    └─ description
        ↓ 1:N
        PERMISSIONS
        ├─ id (PK)
        ├─ resource → "users", "grades", "courses"
        └─ action → "create", "read", "update", "delete"
```

---

### Apps 2-7 : Gestion Pédagogique

**Hiérarchie** :

```
USERS (foundation)
├─ 1:1 ─→ STUDENTS
├─ 1:1 ─→ TEACHERS
│
SPECIALIZATIONS
├─ 1:N ─→ COURSES
├─ 1:N ─→ STUDENTS
│
COURSES
├─ N:1 ─→ TEACHERS (taught_by)
├─ 1:N ─→ INSCRIPTIONS
├─ 1:N ─→ GRADES
└─ 1:N ─→ ATTENDANCES
    │
    ├─ STUDENTS ─→ 1:N → INSCRIPTIONS
    │ 1:N → GRADES
    │ 1:N → ATTENDANCES
```

**STUDENTS**

```
STUDENTS
├─ id (PK)
├─ user_id (FK) → USERS
├─ registration_number (UK) → "PROF-2024-001"
├─ specialization_id (FK) → SPECIALIZATIONS
├─ enrollment_date
├─ is_active
└─ created_at
```

**GRADES** (Critique pour synchronisation)

```
GRADES
├─ id (PK)
├─ student_id (FK) → STUDENTS
├─ course_id (FK) → COURSES
├─ teacher_id (FK) → TEACHERS
├─ grade (0-20)
├─ date_graded
├─ synced ← ⚠️ Flag synchronisation
├─ created_at
└─ updated_at ← ⚠️ Pour détection conflits
    │
    UK : (student_id, course_id) ← Pas 2 notes pour même combo
```

**ATTENDANCES** (Critique pour synchronisation)

```
ATTENDANCES
├─ id (PK)
├─ student_id (FK) → STUDENTS
├─ course_id (FK) → COURSES
├─ teacher_id (FK) → TEACHERS
├─ attendance_date
├─ present (boolean)
├─ reason_if_absent
├─ synced ← ⚠️ Flag synchronisation
└─ created_at
    │
    UK : (student_id, course_id, attendance_date) ← Un appel par jour
```

---

### Apps 8-9 : Finance et Paiement

```
INSCRIPTIONS ─→ 1:1 ─→ INVOICES
                        ├─ id (PK)
                        ├─ inscription_id (FK) ← Clé étrangère unique
                        ├─ student_id (FK)
                        ├─ amount
                        ├─ status → "pending", "paid", "overdue"
                        ├─ invoice_number (UK)
                        ├─ due_date
                        └─ created_at
                            ↓ 1:N
                            PAYMENTS
                            ├─ id (PK)
                            ├─ invoice_id (FK)
                            ├─ student_id (FK)
                            ├─ amount
                            ├─ status → "pending", "completed", "failed"
                            ├─ payment_method_id (FK)
                            ├─ reference_number
                            ├─ synced ← ⚠️ Flag synchronisation
                            └─ created_at
                                ↓ 1:1
                                RECEIPT
                                ├─ id (PK)
                                ├─ payment_id (FK) ← Unique
                                ├─ receipt_number (UK)
                                ├─ pdf_path
                                └─ generated_at
```

---

### Apps 10 : Projets, Stages, Mentorat, Business Plan

```
STUDENTS ─→ 1:N ─→ PROJECTS
                    ├─ id (PK)
                    ├─ name
                    ├─ course_id (FK)
                    ├─ teacher_id (FK) ← Superviseur
                    ├─ status → "planning", "in_progress", "completed"
                    ├─ final_grade
                    └─ created_at
                        ├─ 1:N → PROJECT_MEMBERS
                        │         ├─ id (PK)
                        │         ├─ project_id (FK)
                        │         ├─ student_id (FK)
                        │         ├─ role → "leader", "member"
                        │         └─ contribution
                        │
                        └─ 1:N → PROJECT_DELIVERABLES
                                  ├─ id (PK)
                                  ├─ project_id (FK)
                                  ├─ name
                                  ├─ due_date
                                  ├─ status
                                  ├─ file_path
                                  └─ grade

STUDENTS ─→ 1:N ─→ INTERNSHIPS
                    ├─ id (PK)
                    ├─ student_id (FK)
                    ├─ company_id (FK)
                    ├─ mentor_id (FK) ← Teacher mentor
                    ├─ start_date
                    ├─ end_date
                    ├─ status
                    ├─ final_grade
                    └─ certificate_path
                        └─ 1:N → INTERNSHIP_LOGS
                                  ├─ id (PK)
                                  ├─ internship_id (FK)
                                  ├─ log_date
                                  ├─ daily_activities
                                  └─ challenges

STUDENTS ─→ 1:N ─→ MENTORSHIP
                    ├─ id (PK)
                    ├─ student_id (FK)
                    ├─ teacher_id (FK)
                    ├─ start_date
                    ├─ status
                    └─ objectives
                        └─ 1:N → MENTORSHIP_SESSIONS
                                  ├─ id (PK)
                                  ├─ mentorship_id (FK)
                                  ├─ session_date
                                  ├─ duration_minutes
                                  ├─ notes
                                  └─ feedback

STUDENTS ─→ 1:N ─→ BUSINESS_PLANS
                    ├─ id (PK)
                    ├─ student_id (FK)
                    ├─ business_name
                    ├─ description
                    ├─ financial_projection
                    ├─ status
                    └─ final_grade
                        └─ 1:N → BUSINESS_PLAN_PRESENTATIONS
                                  ├─ id (PK)
                                  ├─ business_plan_id (FK)
                                  ├─ presentation_date
                                  ├─ score
                                  └─ evaluator_comments
```

---

### App 11 : Événements et Communication

```
EVENTS
├─ id (PK)
├─ name
├─ description
├─ event_type → "conference", "training", "ceremony"
├─ start_datetime
├─ end_datetime
├─ location
├─ capacity_max
├─ status → "draft", "published", "ongoing", "completed"
├─ creator_id (FK) → USERS
└─ created_at
    ├─ 1:N → EVENT_PARTICIPANTS
    │         ├─ id (PK)
    │         ├─ event_id (FK)
    │         ├─ user_id (FK)
    │         ├─ registration_date
    │         └─ status → "registered", "attended", "absent"
    │
    └─ 1:N → EVENT_MEDIA
              ├─ id (PK)
              ├─ event_id (FK)
              └─ media_file_id (FK)

ANNOUNCEMENTS
├─ id (PK)
├─ author_id (FK) → USERS
├─ title
├─ content
├─ category → "general", "academic", "administrative"
├─ priority → "low", "normal", "high", "urgent"
├─ publish_date
├─ is_published
└─ created_at
    └─ 1:N → ANNOUNCEMENT_RECIPIENTS
              ├─ id (PK)
              ├─ announcement_id (FK)
              ├─ recipient_id (FK)
              ├─ is_read
              └─ read_at

MEDIA_FOLDERS
├─ id (PK)
├─ name (UK)
├─ description
├─ parent_folder_id (FK) ← Self-reference (hiérarchie)
├─ owner_id (FK) → USERS
└─ 1:N → MEDIA_FILES
          ├─ id (PK)
          ├─ folder_id (FK)
          ├─ uploader_id (FK)
          ├─ filename (UK)
          ├─ file_type → "pdf", "image", "video"
          ├─ file_size
          ├─ storage_path → S3
          ├─ download_count
          └─ created_at
```

---

### App 12 : Notifications

```
NOTIFICATIONS
├─ id (PK)
├─ recipient_id (FK) → USERS
├─ trigger_id (FK) → NOTIFICATION_TRIGGERS
├─ trigger_type → "grade_added", "absence_recorded", etc.
├─ title
├─ content
├─ priority → "low", "normal", "high", "urgent"
├─ is_read
├─ read_at
└─ created_at
    └─ 1:N → NOTIFICATION_QUEUE
              ├─ id (PK)
              ├─ notification_id (FK)
              ├─ channel_id (FK) → NOTIFICATION_CHANNELS
              ├─ status → "pending", "sent", "failed"
              ├─ recipient_address → Email ou phone
              ├─ error_message
              ├─ retry_count
              ├─ synced ← ⚠️ Pour offline
              └─ created_at

NOTIFICATION_CHANNELS
├─ id (PK)
├─ name (UK) → "email", "sms", "push", "in_app"
└─ is_active

NOTIFICATION_TRIGGERS
├─ id (PK)
├─ trigger_name (UK)
└─ template_key
    └─ 1:N → NOTIFICATION_TEMPLATES
              ├─ template_key
              ├─ channel
              ├─ subject_line
              ├─ content_template
              └─ variables

NOTIFICATION_PREFERENCES
├─ id (PK)
├─ user_id (FK)
├─ trigger_type
├─ email_enabled
├─ sms_enabled
├─ push_enabled
├─ quiet_hours_start
└─ quiet_hours_end
```

---

### App 13 : Gestion RH

```
TEACHERS ─→ 1:N ─→ CONTRACTS
                    ├─ id (PK)
                    ├─ teacher_id (FK)
                    ├─ contract_type → "permanent", "temporary"
                    ├─ start_date
                    ├─ end_date
                    ├─ monthly_salary
                    ├─ status
                    ├─ contract_file_path
                    └─ notice_period_days

            1:N ─→ SALARIES
                    ├─ id (PK)
                    ├─ teacher_id (FK)
                    ├─ pay_period_start
                    ├─ pay_period_end
                    ├─ base_salary
                    ├─ bonuses
                    ├─ deductions
                    ├─ net_salary
                    ├─ status → "pending", "paid", "bounced"
                    ├─ payment_date
                    └─ payslip_path

            1:N ─→ LEAVES
                    ├─ id (PK)
                    ├─ teacher_id (FK)
                    ├─ leave_type_id (FK) → LEAVE_TYPES
                    ├─ start_date
                    ├─ end_date
                    ├─ days_used
                    ├─ status → "pending", "approved", "rejected"
                    ├─ approver_id (FK) → USERS
                    └─ reason

            1:N ─→ PERFORMANCE_EVALUATIONS
                    ├─ id (PK)
                    ├─ teacher_id (FK)
                    ├─ evaluator_id (FK) → USERS
                    ├─ evaluation_date
                    ├─ rating (1-5)
                    ├─ strengths
                    ├─ areas_for_improvement
                    └─ evaluation_type

LEAVE_TYPES
├─ id (PK)
├─ name (UK) → "annual", "sick", "maternity"
├─ days_per_year
└─ is_paid

HR_DOCUMENTS
├─ id (PK)
├─ teacher_id (FK)
├─ document_type → "diploma", "certification", "license"
├─ filename
├─ file_path
├─ expiry_date
└─ status → "valid", "expired"

AUDIT_LOG ← ⚠️ Trace complète pour RH
├─ id (PK)
├─ admin_id (FK)
├─ entity_type → "salary", "contract", "leave"
├─ entity_id (FK)
├─ action → "create", "update", "delete", "approve"
├─ changes_json
└─ action_at
```

---

### App 14 : AI et Synchronisation

```
AI_PREDICTIONS
├─ id (PK)
├─ student_id (FK)
├─ prediction_type → "performance", "dropout_risk", "needs_tutoring"
├─ prediction_score (0.0-1.0)
├─ explanation
└─ prediction_date

AI_RECOMMENDATIONS
├─ id (PK)
├─ student_id (FK)
├─ ai_prediction_id (FK)
├─ recommendation_type → "tutoring", "mentoring"
├─ recommendation_text
├─ priority
└─ action_taken

AI_INSIGHTS
├─ id (PK)
├─ insight_type → "class_performance", "cohort_analysis"
├─ specialization
├─ insight_text
├─ supporting_metric
└─ insight_date

─────────────────────────────────────

SYNC_QUEUE ← ⚠️ Orchestration
├─ id (PK)
├─ queue_name (UK)
├─ status → "active", "paused", "completed"
├─ total_operations
├─ operations_completed
└─ last_sync
    └─ 1:N → SYNC_OPERATIONS
              ├─ id (PK)
              ├─ queue_id (FK)
              ├─ initiated_by (FK) → USERS
              ├─ operation_type → "insert", "update", "delete"
              ├─ table_name
              ├─ record_id
              ├─ conflict_status → "pending", "conflict", "resolved", "synced"
              └─ created_at

LOCAL_QUEUE_ENTRY ← ⚠️ Données locales en attente
├─ id (PK)
├─ sync_operation_id (FK)
├─ table_name
├─ record_id
├─ action → "create", "update", "delete"
├─ data (JSON)
├─ local_timestamp
├─ synced
└─ has_conflict

CONFLICT_RESOLUTION ← ⚠️ Résolution manuelle
├─ id (PK)
├─ sync_operation_id (FK)
├─ conflict_type → "version_mismatch", "deleted_remotely"
├─ local_version (JSON)
├─ remote_version (JSON)
├─ resolution_choice → "local", "remote", "manual_merge"
├─ resolved_by (FK) → USERS
└─ resolved_at

SYNC_LOG ← ⚠️ Historique de synchronisation
├─ id (PK)
├─ sync_operation_id (FK)
├─ status → "pending", "in_progress", "success", "failed"
├─ error_message
├─ retry_count
└─ logged_at
```

---

## Synchronisation Offline-First

### Problème Central

**Contexte** :
- L'école fonctionne en **local** (réseau interne, pas d'internet)
- L'application doit aussi fonctionner en **ligne** (accès depuis l'extérieur)
- Les données doivent être **synchronisées** sans perte ni corruption

### Scénarios Problématiques

**Scénario 1 : Mode Local**
```
Professeur saisit les notes des étudiants EN LOCAL
  → L'application n'a pas accès à PostgreSQL cloud
  → Les données sont stockées LOCALEMENT sur la machine
  → UI doit être responsive (pas d'attente réseau)
```

**Scénario 2 : Mode Hybride**
```
Un jour, la connexion internet revient
  → Les notes saisies LOCALEMENT doivent être REMONTÉES au serveur
  → Si des CONFLITS (même étudiant, notes différentes) ?
  → Comment les résoudre ?
```

**Scénario 3 : Mode Cloud**
```
Administrateur accède depuis un cybercafé (internet)
  → Il saisit une note pour un étudiant
  → ET si un professeur a DÉJÀ saisi une note localement
     pour le même étudiant ?
  → Quelle version garder ?
```

---

### Défis de la Synchronisation

| Challenge | Exemple | Solution |
|-----------|---------|----------|
| **Conflits de données** | Même note modifiée localement ET en ligne | `CONFLICT_RESOLUTION` + timestamp comparison |
| **Ordre des opérations** | 10 notes saisies offline | Queue avec replay en ordre |
| **Intégrité référentielle** | Note sans étudiant inscrit | Validation au sync |
| **Timestamp et versioning** | Qui a modifié en dernier ? | `created_at`, `updated_at` |
| **Détection d'orphelins** | Présence sans cours | Validation au sync |

---

### Architecture Recommandée : Queue + Conflict Detection

#### Phase 1 : Mode Local (Offline)

```
Professeur saisit note "16" pour Étudiant X, Cours Y
    ↓
SQLite Local :
  INSERT GRADES (student_id=X, course_id=Y, grade=16, synced=false, updated_at=NOW)
    ↓
LOCAL_QUEUE_ENTRY :
  INSERT (table='GRADES', action='insert', record_id=X, local_timestamp=NOW, synced=false)
    ↓
UI affiche : "Note saisie ✓"
(Feedback immédiat, pas d'attente réseau)
```

#### Phase 2 : Reconnexion Détectée

```
Connexion internet revient
    ↓
SYNC MANAGER s'initialise
    ↓
Lit LOCAL_QUEUE_ENTRY
    ↓
Pour chaque enregistrement :
  1. Vérifie si record existe déjà en cloud
  2. Récupère la version cloud
  3. Compare timestamps
```

#### Phase 3 : Détection de Conflits

```
DEUX CAS :

CAS A : Pas de conflit (pas d'enregistrement en cloud)
  → ENVOYER la note "16" au serveur
  → Cloud INSERT GRADES
  → Marquer synced=true en local
  → Queue entry DELETE

CAS B : CONFLIT (version cloud existe ET différente)
  Local version   : grade=16, updated_at=2024-06-10 14:30
  Remote version  : grade=14, updated_at=2024-06-10 15:00
    ↓
  Cloud plus récent (15:00 > 14:30)
    ↓
  INSERT CONFLICT_RESOLUTION :
    conflict_type = "version_mismatch"
    local_version = {grade: 16, ...}
    remote_version = {grade: 14, ...}
    status = "pending"
    ↓
  Admin notification : "Conflit détecté pour Élève X"
    ↓
  Admin choisit : "Garder 16" (local) ou "Garder 14" (remote) ?
    ↓
  CONFLICT_RESOLUTION.resolution_choice = "local"
    ↓
  GRADES UPDATE : grade=16 (cloud)
  Marquer synced=true en local
```

---

### Métadonnées Essentielles

**Pour chaque table critique** (GRADES, ATTENDANCES, PAYMENTS, etc.) :

```
├─ synced (boolean) 
│  → Envoyée au serveur ? true/false
│
├─ created_at (timestamp)
│  → Quand créée
│
├─ updated_at (timestamp)
│  → Dernière modification (pour Last-Write-Wins)
│
├─ user_id (FK)
│  → Qui a créé/modifié ? (audit)
│
└─ version (int)
   → Numéro de version (optionnel, pour LWW)
```

---

### Tableau Comparatif des Approches

| Critère | Queue & Replay | Last-Write-Wins | OT | Manual Resolution |
|---------|---|---|---|---|
| **Complexité** | 🟢 Faible | 🟢 Faible | 🔴 Très haute | 🟡 Moyenne |
| **Perte de données** | ❌ Non | ✅ Possible | ❌ Non | ❌ Non |
| **Temps implémentation** | Rapide (2 semaines) | Rapide (1 semaine) | Plusieurs mois | Moyen (3 semaines) |
| **Idéal pour écoles** | ✅ OUI | ❌ Non | ❌ Non | ✅ Oui (fallback) |
| **Maintenance** | Faible | Faible | Très élevé | Moyen |

**Recommandation** : **Queue + Conflict Detection** (hybride)

---

### Flux Complet : Saisie de Note Offline → Sync

```
JOUR 1 - PROFESSEUR OFFLINE
┌─────────────────────────────────────┐
│ 14:30 Saisit note "16"              │
│       INSERT GRADES (synced=false)  │
│       INSERT LOCAL_QUEUE_ENTRY      │
│       UI : "Note saisie ✓"          │
└─────────────────────────────────────┘

JOUR 1 - ADMIN ONLINE (Cybercafé)
┌─────────────────────────────────────┐
│ 15:00 Saisit note "14"              │
│       PostgreSQL INSERT GRADES      │
│       (synced=true, updated_at=...)│
└─────────────────────────────────────┘

JOUR 2 - PROFESSEUR SE CONNECTE
┌─────────────────────────────────────┐
│ Sync Manager s'initialise           │
│                                     │
│ Lit LOCAL_QUEUE_ENTRY               │
│   → action='insert', grade=16       │
│                                     │
│ Vérifie cloud :                     │
│   → EXISTE déjà : grade=14          │
│   → updated_at(cloud)=15:00         │
│   → updated_at(local)=14:30         │
│   → CONFLIT DÉTECTÉ !               │
│                                     │
│ INSERT CONFLICT_RESOLUTION :        │
│   conflict_status = 'pending'       │
│   local_version = 16                │
│   remote_version = 14               │
│                                     │
│ Notification ADMIN :                │
│ "Conflit note élève X"              │
│ Choisir 16 ou 14 ?                  │
│                                     │
│ [Admin clique : "16"]               │
│                                     │
│ CONFLICT_RESOLUTION.update :        │
│   resolution_choice = 'local'       │
│   resolved_by = admin_id            │
│   resolved_at = NOW()               │
│                                     │
│ GRADES.update (cloud) :             │
│   grade = 16                        │
│   synced = true                     │
│                                     │
│ LOCAL_QUEUE_ENTRY.delete()          │
│                                     │
│ SYNC_LOG.insert :                   │
│   status = 'success'                │
│   sync_operation_id = ...           │
│                                     │
│ Notification PROF :                 │
│ "Sync complétée avec succès ✓"      │
│                                     │
│ Notification ÉLÈVE :                │
│ "Votre note en Maths : 16/20"       │
└─────────────────────────────────────┘
```

---

## Dépendances entre Applications

### Graphe de Dépendances

```
GESTION UTILISATEUR ← FOUNDATION
    │
    ├─ GESTION ÉLÈVE
    │   ├─ GESTION INSCRIPTION
    │   │   ├─ GESTION COURS
    │   │   │   ├─ GESTION NOTE
    │   │   │   └─ GESTION PRÉSENCE
    │   │   ├─ GESTION FINANCE
    │   │   │   └─ SYSTÈME PAIEMENT
    │   │   └─ NOTIFICATION
    │   │
    │   ├─ GESTION PROJET/STAGES ← Documents
    │   │   └─ GESTION MÉDIA
    │   │
    │   ├─ GESTION AI ← Analyse données
    │   │   ├─ GESTION NOTE (input)
    │   │   └─ GESTION PRÉSENCE (input)
    │   │
    │   └─ GESTION ÉVÉNEMENTS ← Participation
    │
    ├─ GESTION PROFESSEUR
    │   ├─ GESTION NOTE ← Saisit
    │   ├─ GESTION PRÉSENCE ← Saisit
    │   ├─ GESTION PROJET/STAGES ← Supervise
    │   ├─ GESTION RH ← Données contractuelles
    │   └─ NOTIFICATION ← Envoi mails
    │
    └─ GESTION RH ← Données sensibles
        ├─ GESTION PROFESSEUR
        └─ AUDIT_LOG ← Traçabilité légale
```

---

### Ordre de Déploiement Recommandé

```
1️⃣  GESTION UTILISATEUR (Foundation)
    → Aucune dépendance

2️⃣  GESTION ÉLÈVE + GESTION PROFESSEUR
    → Dépendent uniquement de Users

3️⃣  GESTION COURS + GESTION INSCRIPTION
    → Dépendent de Élève, Professeur, (optionnellement Specializations)

4️⃣  GESTION NOTE + GESTION PRÉSENCE
    → Dépendent de Cours, Élève, Professeur

5️⃣  GESTION FINANCE + SYSTÈME PAIEMENT
    → Dépendent d'Inscription

6️⃣  GESTION ÉVÉNEMENTS + GESTION MÉDIA
    → Indépendantes (peuvent être parallèles)

7️⃣  GESTION PROJET/STAGES/MENTORAT/BUSINESS PLAN
    → Dépendent d'Élève, Professeur

8️⃣  GESTION AI
    → Dépend de Note, Présence (données de training)

9️⃣  SYSTÈME NOTIFICATION
    → Peut être déployée tardivement (décorateur)

🔟 GESTION RH
    → Dépend de Professeur, optionnelle pour petites écoles
```

---

## Cas d'Usage

### Cas 1 : Inscription d'un Nouvel Étudiant

```
ÉTAPE 1 : Candidature Online
  Étudiant visite site public
    → Voir cours disponibles (GESTION COURS)
    → Cliquer "S'inscrire"
    → Remplir formulaire (nom, email, spécialité)

ÉTAPE 2 : Création de Compte
  Système crée USERS + STUDENTS
    → Email verification token envoyé

ÉTAPE 3 : Approbation Admin
  Admin visite dashboard
    → Voit inscriptions "pending"
    → Vérifie documents (si requis)
    → Clique "Approuver"
    → INSCRIPTIONS.status = "approved"

ÉTAPE 4 : Auto-Facturation
  Système trigger (app Finance) :
    → Crée INVOICES
    → Montant = fees de la classe
    -> entrer le montant paye

ÉTAPE 5 : Paiement
  Étudiant clique lien de paiement
    → Redirection Stripe/PayPal
    → Paiement confirmé
    → Webhook reçu (backend)
    → PAYMENTS.status = "completed"
    → INVOICES.status = "paid"
    → Email + NOTIFICATION : "Paiement reçu ✓"

ÉTAPE 6 : Activation
  Admin confirme
    → INSCRIPTIONS.status = "active"
    → Étudiant peut voir son cours
    → Peut voir ses notes/présences (vides)
    → Email bienvenue envoyée

ÉTAPE 7 : Début Cours
  Professeur en local :
    → Fait l'appel (GESTION PRÉSENCE)
    → Saisit notes (GESTION NOTE)
    → Données : synced=false, queued localement

ÉTAPE 8 : Reconnexion
  Sync Manager :
    → Envoie présences et notes
    → Pas de conflits
    → NOTIFICATION : "Votre note : 16/20"
```

---

### Cas 2 : Saisie de Note Offline avec Conflit

```
JOUR 1 - 14:30 PROFESSEUR EN LOCAL
  Saisit note "16" pour Élève X, Cours Y
    → GRADES INSERT (synced=false)
    → LOCAL_QUEUE_ENTRY INSERT
    → UI : "Note saisie ✓"

JOUR 1 - 15:00 ADMIN ONLINE
  Saisit note "14" pour MÊME Élève X, Cours Y
    → PostgreSQL INSERT (synced=true)
    → Notification automatique : "Note saisie pour X"

JOUR 2 - PROFESSEUR CONNECTE
  Sync Manager s'initialise
    → Détecte CONFLIT
    → LOCAL_QUEUE_ENTRY : grade=16
    → PostgreSQL : grade=14
    ↓
  Admin notification : "CONFLIT DÉTECTÉ"
  "Élève X, Cours Y"
  "Local : 16"
  "Cloud : 14"
  "Qui choisir ?"
    ↓
  Admin clique "Garder 16"
    ↓
  CONFLICT_RESOLUTION.insert :
    resolution_choice = "local"
    resolved_by = admin_id
    resolved_at = NOW()
    ↓
  PostgreSQL UPDATE : GRADES.grade = 16
    ↓
  SYNC_LOG.insert : status = "success"
    ↓
  Notification ÉLÈVE : "Votre note : 16/20"
    ↓
  Notification PROF : "Note synchronisée ✓"
```

---

### Cas 3 : Appel de Présence Offline (Batch)

```
MATIN 8:00 - PROFESSEUR EN LOCAL
  35 étudiants en classe
  Fait l'appel rapidement :
    → 30 présents, 5 absents
    ↓
  ATTENDANCES INSERT ×35
    { student_id, course_id, attendance_date=today, present, synced=false }
  ↓
  LOCAL_QUEUE_ENTRY INSERT ×35
    { table='ATTENDANCES', action='insert', synced=false }
    ↓
  UI : "Appel saisie ✓ (35 étudiants)"
  (Feedback immédiat)

MIDI 12:00 - RECONNEXION INTERNET
  Sync Manager s'initialise
    ↓
  Lit LOCAL_QUEUE_ENTRY ×35
    ↓
  Pour chaque présence :
    1. Vérifie si (student, course, date) existe déjà en cloud
    2. Aucun conflit (appel n'a pas été fait en cloud)
    ↓
  ENVOIE les 35 présences au serveur
    ↓
  PostgreSQL INSERT ATTENDANCES ×35
    ↓
  Marque synced=true ×35
    ↓
  LOCAL_QUEUE_ENTRY DELETE ×35
    ↓
  NOTIFICATION TRIGGER :
    "Vous avez 2 absences en Maths"
    → NOTIFICATION INSERT ×2 (étudiants absents)
    → EMAIL DÉCLENCHÉ (à leurs parents)
    → QUEUE NOTIFICATION INSERT (pending email)
    ↓
  SYNC_LOG.insert : status='success', operations=35
    ↓
  Notification PROFESSEUR : "Appel synchronisé ✓ (35 étudiants)"
```

---

### Cas 4 : Gestion d'un Projet Pedagogique

```
SEMAINE 1 - PROFESSEUR CRÉE PROJET
  Dashboard Admin en ligne
    → GESTION PROJET : "Créer nouveau projet"
    → Nom : "Développer une app e-commerce"
    → Cours : "Développement Web"
    → Date deadline : 15 mai
    → PROJECTS INSERT
    → Notification : "Nouveau projet créé"

SEMAINE 1 - INSCRIPTION D'ÉTUDIANTS
  Étudiants voient projet dans app
    → "Rejoindre ce projet"
    → PROJECT_MEMBERS INSERT ×5
    → Notification : "Vous êtes dans le projet XYZ"

SEMAINES 2-7 - TRAVAIL SUR LE PROJET
  Étudiants uploadent deliverables offline
    → Documents sauvegardés localement (pas uploadé)
    → Stockage local : documents/ folder
    → SYNC_LOG : "pending upload"
  
  Professeur commente :
    → Online : voit les documents sur S3
    → Ajoute feedback/notes
    → COMMENT INSERT
    → Notification étudiant : "Feedback sur votre deliverable"

  À la reconnexion des étudiants :
    → Local documents uploadés à S3
    → SYNC_LOG : status='success'
    → Prof peut voir documents en S3

SEMAINE 8 - ÉVALUATION
  Professeur évalue projet :
    → PROJECTS.final_grade = 18/20
    → PROJECTS.status = "evaluated"
    → Notification : "Projet évalué : 18/20 ✓"

SEMAINE 8 - GÉNÉRATION DE RAPPORT
  Gestion AI calcule :
    → Performance du groupe
    → Contribution individuelle (log des uploads)
    → Recommandations
    → INSIGHTS INSERT
    → Rapport généré (PDF)
```

---

## Sécurité et Permissions

### Contrôle d'Accès par Rôle (RBAC)

#### Matrice des Permissions

| Ressource | Student | Teacher | Admin | Parent | HR |
|-----------|---------|---------|-------|--------|-----|
| **Voir ses propres notes** | ✅ | N/A | ✅ | ✅* | ❌ |
| **Saisir une note** | ❌ | ✅** | ✅ | ❌ | ❌ |
| **Voir présences** | ✅ | ✅** | ✅ | ✅* | ❌ |
| **Faire l'appel** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **S'inscrire à un cours** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Créer un cours** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Voir salaire** | N/A | ✅ | ✅ | N/A | ✅ |
| **Approuver congés** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Accès RH** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Générer rapports** | ❌ | ❌ | ✅ | ❌ | ✅ |

**Légende** :
- ✅ = Accès complet
- ✅* = Accès si enfant/parent autorisé
- ✅** = Accès sur ses propres cours
- ❌ = Pas d'accès

---

### Implémentation Django

#### 1. Modèle PERMISSIONS

```python
# models.py
class Permission(models.Model):
    RESOURCES = [
        ('users', 'Gestion Utilisateurs'),
        ('grades', 'Gestion Notes'),
        ('attendances', 'Gestion Présences'),
        ('courses', 'Gestion Cours'),
        ...
    ]
    
    ACTIONS = [
        ('create', 'Créer'),
        ('read', 'Lire'),
        ('update', 'Modifier'),
        ('delete', 'Supprimer'),
    ]
    
    resource = models.CharField(max_length=50, choices=RESOURCES)
    action = models.CharField(max_length=20, choices=ACTIONS)
    
    class Meta:
        unique_together = ('resource', 'action')
```

#### 2. Décorateur Vue DRF

```python
# permissions.py
from rest_framework.permissions import BasePermission

class HasResourcePermission(BasePermission):
    def has_permission(self, request, view):
        resource = view.resource_name
        action = view.action_map.get(request.method)
        
        user_permissions = request.user.role.permissions.all()
        perm_exists = user_permissions.filter(
            resource=resource,
            action=action
        ).exists()
        
        return perm_exists

# views.py
class GradeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasResourcePermission]
    resource_name = 'grades'
    action_map = {
        'GET': 'read',
        'POST': 'create',
        'PUT': 'update',
        'DELETE': 'delete',
    }
```

---

### Sécurité des Données Offline

#### Chiffrement Local (Optionnel)

```python
# Pour données sensibles en local
from cryptography.fernet import Fernet

class EncryptedWatermelonDB:
    def __init__(self, key):
        self.cipher = Fernet(key)
    
    def encrypt_sensitive_data(self, data):
        return self.cipher.encrypt(data.encode())
    
    def decrypt_sensitive_data(self, encrypted_data):
        return self.cipher.decrypt(encrypted_data).decode()
```

#### Tokens JWT Locaux

```python
# Frontend
localStorage.setItem('auth_token', jwtToken)

// Valide X jours en offline
if (jwtToken.exp < Date.now() / 1000) {
  // Token expiré → forcer sync online
}
```

---

### Audit Trail Complet

```python
# models.py
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20)  # create, update, delete, approve
    entity_type = models.CharField(max_length=50)  # grades, attendance, etc.
    entity_id = models.UUIDField()
    old_values = models.JSONField()
    new_values = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True)

# Middleware pour logger automatiquement
class AuditLogMiddleware:
    def log_change(self, user, action, entity_type, entity_id, old, new):
        AuditLog.objects.create(
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old,
            new_values=new,
            ip_address=self.get_client_ip(),
        )
```

---

### RGPD et Conformité

#### Droit à l'Oubli

```python
def delete_student_data(student_id):
    """
    Suppression GDPR pour un étudiant
    """
    student = Student.objects.get(id=student_id)
    
    # Anonymiser avant suppression
    student.user.email = f"deleted_{student_id}@deleted.local"
    student.user.first_name = "DELETED"
    student.user.last_name = "DELETED"
    student.user.is_active = False
    student.user.save()
    
    # Garder les notes (légalement requises)
    # Mais anonymiser l'étudiant
    for grade in student.grades.all():
        grade.student_id = NULL  # Ou identifiant anonyme
        grade.save()
    
    # Logger
    AuditLog.objects.create(
        action="gdpr_deletion",
        entity_type="student",
        entity_id=student_id,
    )
```

---

## Résumé

### Points Clés

✅ **14 Apps modulaires** avec dépendances claires
✅ **Synchronisation offline-first** robuste (queue + conflict detection)
✅ **Modèles de données normalisés** (ENS 3NF)
✅ **Permissions granulaires** basées sur rôles
✅ **Audit trail complet** pour traçabilité légale
✅ **Stack moderne** (Django, React, PostgreSQL, Redis)

### Prochaines Étapes

1. **Créer les migrations Django** pour les 14 apps
2. **Implémenter les API REST** endpoints
3. **Développer le Sync Manager** (queue + conflict detection)
4. **Tester en offshore** (scenario de conflits)
5. **Déployer en Docker** (local + cloud)

### Timeline Estimée

- **Semaines 1-2** : Setup Django + création modèles
- **Semaines 3-4** : API REST pour core apps (Users, Students, Courses, Grades)
- **Semaines 5-6** : Sync Manager + offline-first
- **Semaines 7-8** : Frontend React + WatermelonDB
- **Semaines 9-10** : Finance + Notification
- **Semaines 11-12** : Tests, déploiement, documentation

---

**Document généré pour : Système de Gestion Scolaire Professionnel**  
**Date** : Juin 2024  
**Version** : 1.0 - Analyse complète
