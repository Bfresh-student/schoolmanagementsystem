# Guide d'Intégration Frontend ↔ API Backend (CEJEC)

Ce document fournit la cartographie complète des endpoints de l'API REST de CEJEC et les associe directement aux différentes pages de votre frontend. Il vous servira de feuille de route pour finaliser l'intégration des données dynamiques.

## 1. Principes Généraux de l'API

- **URL de Base :** `http://localhost:8000/api/v1/`
- **Authentification :** JWT (JSON Web Tokens). Vous devez inclure le token d'accès dans les headers de chaque requête protégée :
  ```javascript
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
    'Content-Type': 'application/json'
  }
  ```
- **Pagination :** Les listes (ex: utilisateurs, étudiants) renvoient souvent un objet paginé : `{ "count": X, "next": "...", "previous": null, "results": [...] }`. Votre frontend doit lire le tableau dans `data.results` si la pagination est activée, sinon `data` directement.

---

## 2. Cartographie par Page Frontend

### A. Authentification (`Se connecter - Admin.html`)
**Fonctionnalité :** Connexion et Création de compte.

| Action | Méthode | Endpoint | Body (Payload) |
|---|---|---|---|
| **Login (Obtenir Token)** | `POST` | `/token/` | `{ "email": "...", "password": "..." }` |
| **Refresh Token** | `POST` | `/token/refresh/` | `{ "refresh": "..." }` |
| **Inscription (Nouveau compte)** | `POST` | `/auth/users/register/` | `{ "email": "...", "password": "...", "password_confirm": "...", "first_name": "...", "last_name": "...", "role": "STUDENT\|TEACHER" }` |

> [!TIP]
> **Stockage :** Sauvegardez le `access` token et le `refresh` token dans le `localStorage` dès la réception de la réponse du `/token/`.

---

### B. Tableau de Bord (`Dashbord-Admin.html` & `Eseye.html`)
**Fonctionnalité :** Affichage des statistiques globales (KPIs) et informations de l'utilisateur connecté.

| Action | Méthode | Endpoint | Réponse attendue |
|---|---|---|---|
| **KPIs (Stats Dashboard)** | `GET` | `/dashboard/stats/` | `{ "students_count": X, "teachers_count": X, "courses_count": X, "revenue": Y }` |
| **Profil Utilisateur (Header)** | `GET` | `/auth/users/me/` | `{ "id": 1, "email": "...", "full_name": "...", "role": "...", "phone": "..." }` |

> [!NOTE]
> Le script `script_dash.js` et `user-profile.js` consomment déjà ces APIs.

---

### C. Gestion des Utilisateurs (`gestion_utilisateurs.html`)
**Fonctionnalité :** Liste, création, modification, suppression des élèves et des professeurs.

| Action | Méthode | Endpoint | Remarques |
|---|---|---|---|
| **Lister les Étudiants** | `GET` | `/auth/users/?role=STUDENT` | Renvoie la liste pour l'onglet Élèves |
| **Lister les Professeurs** | `GET` | `/auth/users/?role=TEACHER` | Renvoie la liste pour l'onglet Personnel |
| **Détails Profil Étudiant**| `GET` | `/students/students/<id>/` | Fournit les détails académiques (filière, classe, etc.) |
| **Détails Profil Prof.**| `GET` | `/teachers/<id>/` | Fournit les qualifications et spécialités du prof |
| **Modifier Infos de Base** | `PATCH` | `/auth/users/<id>/` | `{ "first_name": "...", "last_name": "...", "phone": "..." }` |
| **Changer le Rôle** | `POST` | `/auth/users/<id>/change-role/` | `{ "role": "ADMIN" }` |
| **Désactiver/Activer** | `POST` | `/auth/users/<id>/change-status/`| `{ "status": "INACTIVE" }` |
| **Supprimer définitivement** | `DELETE` | `/auth/users/<id>/` | Supprime le compte |

> [!IMPORTANT]
> **Évolution de l'API à prévoir :** La page `gestion_utilisateurs.html` regroupe souvent les données d'authentification (`/auth/users/`) et les données métier (`/students/students/`). Il peut être pertinent de créer un endpoint `/api/v1/users/merged/` dans le backend pour renvoyer un objet combiné et faciliter le travail du frontend, ou bien le frontend devra faire 2 requêtes fusionnées (comme il le fait actuellement via `mapApiUserToLocal`).

---

### D. Gestion des Inscriptions (`gestion_inscriptions.html`)
**Fonctionnalité :** Inscrire un étudiant, gérer ses paiements, et valider son dossier.

| Action | Méthode | Endpoint | Payload / Remarques |
|---|---|---|---|
| **Nouvelle Inscription** | `POST` | `/enrollments/inscriptions/` | `{ "student": <id>, "academic_year": "2026", "specialization": <id>, "status": "PENDING" }` |
| **Valider l'Inscription** | `POST` | `/enrollments/inscriptions/<id>/approve/` | Approuve le dossier de l'étudiant |
| **Lister les Factures** | `GET` | `/finance/invoices/?student=<id>` | Permet de voir l'état des paiements (Scolarité) |
| **Ajouter un Paiement** | `POST` | `/finance/payments/` | `{ "invoice": <id>, "amount": 15000, "payment_method": "CASH" }` |

---

### E. Gestion des Classes et Filières (`gestion_classes.html`)
**Fonctionnalité :** Créer des filières, des classes, et assigner des professeurs aux cours.

| Action | Méthode | Endpoint | Remarques |
|---|---|---|---|
| **Lister les Filières/Classes**| `GET` | `/students/specializations/` | Les "classes" frontend correspondent aux "specializations" backend. |
| **Créer une Filière** | `POST` | `/students/specializations/` | `{ "name": "...", "description": "...", "duration_months": X }` |
| **Lister les Cours** | `GET` | `/courses/courses/` | Les cours (matières) dispensés |
| **Créer un Cours** | `POST` | `/courses/courses/` | `{ "title": "...", "credits": X, "specialization": <id> }` |

---

### F. Gestion des Notes (`gestion_notes.html`)
**Fonctionnalité :** Saisir les notes, générer les bulletins.

| Action | Méthode | Endpoint | Remarques |
|---|---|---|---|
| **Saisir des Notes (En lot)**| `POST` | `/grades/grades/bulk_create/`| Un endpoint `bulk` est idéal pour enregistrer toute une classe d'un coup. |
| **Lister les Notes d'un Élève**| `GET` | `/grades/grades/?student=<id>`| 
| **Générer un Bulletin** | `POST` | `/grades/bulletins/generate/`| ` { "student": <id>, "term": "Hiver 2026" }` |
| **Obtenir le Bulletin (PDF/Data)**| `GET` | `/grades/bulletins/<id>/` | 

---

### G. Ressources Humaines (`rh.html`)
**Fonctionnalité :** Gérer les employés (staff) et les professeurs.

| Action | Méthode | Endpoint | Remarques |
|---|---|---|---|
| **Lister le Personnel** | `GET` | `/auth/users/?role=STAFF` | Liste les secrétaires, comptables, RH, etc. |
| **Lister les Candidats** | `GET` | `/hr/candidates/` *(à créer)* | Gestion des recrutements (CVs) |
| **Congés / Absences** | `GET` | `/teachers/leave-requests/` | Liste les demandes de congés |

> [!WARNING]
> Si votre API HR (`/hr/`) n'est pas encore totalement implémentée dans le backend, c'est l'un des premiers modules sur lesquels il faudra se concentrer pour finaliser la page `rh.html`.

---

### H. Incubateur & Projets (`incubateur_calendrier.html`)
**Fonctionnalité :** Gérer les projets des étudiants et les sessions de mentorat.

| Action | Méthode | Endpoint | Remarques |
|---|---|---|---|
| **Lister les Projets** | `GET` | `/projects/projects/` | Projets incubés par les étudiants. |
| **Évaluer un Projet** | `POST` | `/projects/projects/<id>/evaluate/`| Notes du jury / Mentors |
| **Gérer les Mentors** | `GET` | `/projects/mentorships/` | Assigner un mentor à un projet. |
| **Calendrier / Événements** | `GET` | `/events/` *(à créer)* | S'il y a un calendrier d'événements, un endpoint `events` dédié sera nécessaire. |

---

## 3. Recommandations pour la suite de l'intégration

1. **Gérer les Erreurs Globalement :** Dans vos fichiers JavaScript (ex: `script_utilisateur.js`), si l'API retourne un `401 Unauthorized`, redirigez automatiquement vers `Se connecter - Admin.html`.
2. **Standardiser `apiFetch` :** Utilisez une fonction utilitaire (comme celle déjà dans `script_utilisateur.js`) pour injecter automatiquement le token `Bearer` et gérer les `try/catch`.
3. **Mocking (Données Locales) :** Si un endpoint n'est pas encore prêt dans le backend (ex: `/api/v1/hr/candidates/`), gardez les tableaux statiques en JavaScript avec un log `console.warn("Utilisation des données locales - API non prête")` en attendant sa création.
4. **CORS :** Assurez-vous que `django-cors-headers` est bien configuré côté serveur pour autoriser `http://127.0.0.1` ou `http://localhost:5500` (le port de votre Live Server).
