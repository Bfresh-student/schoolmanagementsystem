# Déploiement Docker sur Render

## Vue d'ensemble

**Oui, absolument !** Render supporte nativement les déploiements Docker. C'est même **la méthode recommandée** pour un système complexe comme celui-ci.

---

## Comment Render Gère Docker

### Option 1 : Docker via Dockerfile (Recommandé)

Render détecte un `Dockerfile` à la racine du repo et construit automatiquement l'image.

**Avantages** :
- ✅ Gratuit (image construite par Render)
- ✅ Contrôle total de l'environnement
- ✅ Cohérent entre local et production
- ✅ Prérequis précis (versions Python, dépendances)

**Inconvénients** :
- ⚠️ Build time = 5-15 minutes (peut être lent)
- ⚠️ Si image > 1GB = problèmes de déploiement

---

### Option 2 : Docker via Registry (DockerHub, ECR)

Vous pouvez aussi pousser l'image à un registre puis la déployer sur Render.

**Avantages** :
- ✅ Build sur votre machine (plus rapide)
- ✅ Contrôle des versions d'image

**Inconvénients** :
- ❌ Nécessite compte DockerHub ou AWS ECR
- ❌ Plus complexe pour CI/CD

---

## Architecture Recommandée pour Render

```
Render = Platform-as-a-Service (PaaS)
  ├─ Services Web (Backend Django + API)
  ├─ Background Workers (Celery)
  ├─ PostgreSQL (Managed Database)
  ├─ Redis (Cache, pour Celery)
  └─ Static Files (Managed via Nginx intégré ou S3)

Container Structure :
  ├─ backend/ (Django) → Port 8000
  ├─ frontend/ (React) → Port 3000 (optionnel, peut être sur Vercel/Netlify)
  └─ docker-compose.yml (local uniquement)
```

---

## Configuration Docker pour Render

### 1. Dockerfile (Backend Django)

```dockerfile
# backend/Dockerfile

FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create static files directory
RUN mkdir -p /app/staticfiles

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Run migrations and start server
CMD python manage.py migrate && \
    gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 4 \
    --worker-class sync \
    --timeout 120
```

**Points critiques pour Render** :
- `$PORT` = Render injecte le port dynamiquement
- `PYTHONUNBUFFERED=1` = Les logs s'affichent en temps réel
- `collectstatic` = Render a besoin des fichiers statiques

---

### 2. requirements.txt (Optimisé)

```txt
Django==4.2.13
djangorestframework==3.14.0
django-rest-framework-simplejwt==5.2.2
django-cors-headers==4.1.0
django-channels==4.0.0
django-filter==23.2
psycopg2-binary==2.9.6
redis==4.5.5
celery==5.3.1
gunicorn==21.2.0
python-dotenv==1.0.0
Pillow==10.0.0
```

---

### 3. docker-compose.yml (Local Development Only)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-gestion_scolaire}
      POSTGRES_USER: ${DATABASE_USER:-postgres}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8000"
    environment:
      - DEBUG=True
      - DATABASE_URL=postgresql://${DATABASE_USER:-postgres}:${DATABASE_PASSWORD:-postgres}@db:5432/${DATABASE_NAME:-gestion_scolaire}
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=dev-secret-key-change-in-production
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app

  celery:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A config worker -l info
    environment:
      - DATABASE_URL=postgresql://${DATABASE_USER:-postgres}:${DATABASE_PASSWORD:-postgres}@db:5432/${DATABASE_NAME:-gestion_scolaire}
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=dev-secret-key-change-in-production
    depends_on:
      - db
      - redis
      - backend
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000/api
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
```

---

### 4. .dockerignore

```
.git
.gitignore
__pycache__
*.pyc
*.pyo
*.egg-info
.env
.env.local
node_modules
dist
build
.pytest_cache
.coverage
venv
env
.vscode
.idea
```

---

## Configuration Render.com

### Étape 1 : Créer un Service Web (Backend)

**Sur dashboard Render.com** :

```
1. Cliquer "+ New"
2. Sélectionner "Web Service"
3. Connecter le repo GitHub
4. Configurer le service :

   Name: gestion-scolaire-backend
   Region: Frankfurt (ou closest to you)
   Branch: main
   
   Runtime: Docker
   
   Build Command: (laisser vide - Render utilisera Dockerfile)
   Start Command: (laisser vide - Render utilisera CMD du Dockerfile)
   
   Environment Variables:
   ├─ SECRET_KEY=your-very-long-random-key-here
   ├─ DEBUG=False
   ├─ ALLOWED_HOSTS=gestion-scolaire-backend.onrender.com,yourdomain.com
   ├─ DATABASE_URL=(sera fourni par Render PostgreSQL)
   ├─ REDIS_URL=(sera fourni par Render Redis)
   ├─ CORS_ALLOWED_ORIGINS=https://frontend.yourdomain.com
   └─ AWS_STORAGE_BUCKET_NAME=(si utilisant S3)
   
   Instance Type: Standard
   (Starter = $7/month, enough for dev/test)
```

---

### Étape 2 : Ajouter PostgreSQL

**Sur dashboard Render.com** :

```
1. Cliquer "+ New"
2. Sélectionner "PostgreSQL"
3. Configurer :

   Name: gestion-scolaire-postgres
   PostgreSQL Version: 15
   Region: Same as backend (important !)
   
   Instance Type: Standard
   (Free tier = 256MB RAM, enough for dev)
```

Render génère automatiquement `DATABASE_URL` :
```
postgres://user:password@host:5432/database
```

Ajouter cette variable au Web Service.

---

### Étape 3 : Ajouter Redis

**Sur dashboard Render.com** :

```
1. Cliquer "+ New"
2. Sélectionner "Redis"
3. Configurer :

   Name: gestion-scolaire-redis
   Region: Same as backend
   Instance Type: Standard
   (Free tier = 256MB)
```

Render génère `REDIS_URL` → ajouter au Web Service.

---

### Étape 4 : Déployer le Backend

**Render détecte automatiquement** :
- `Dockerfile` à la racine du repo
- Construit l'image
- Exécute les migrations Django
- Démarre le serveur Gunicorn

**Premier déploiement** = 10-15 minutes (construction image)

---

## Configuration Django pour Render

### settings.py (Production)

```python
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Secret Key
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-only-key')

# Debug
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Allowed Hosts
ALLOWED_HOSTS = os.environ.get(
    'ALLOWED_HOSTS',
    'localhost,127.0.0.1'
).split(',')

# Database (PostgreSQL)
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Redis (Cache + Sessions + Celery)
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Celery
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

# Static Files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media Files (AWS S3 pour Render)
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
if AWS_STORAGE_BUCKET_NAME:
    AWS_S3_REGION_NAME = 'us-east-1'
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
else:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000'
).split(',')

# Security (Production)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}
```

---

## Gestion des Migrations

### Problème

Render redémarre le conteneur à chaque déploiement. Si migrations n'ont pas tourné → erreurs.

### Solution 1 : Via Dockerfile (Recommandé)

```dockerfile
CMD python manage.py migrate && \
    gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT
```

**Avantage** : Migrations automatiques avant le démarrage.

---

### Solution 2 : Via Render "Run Command"

Dans Render dashboard, utiliser une **Job** pour les migrations :

```
1. Cliquer "+ New"
2. Sélectionner "Background Worker"
3. Configurer :

   Name: gestion-scolaire-migrations
   Build Command: pip install -r requirements.txt
   Start Command: python manage.py migrate
   
   Environment: Same as backend
   
   Instance Type: Standard
```

Puis configurer le Web Service pour **dépendre** de cette job.

---

## Déploiement du Frontend (React)

### Option 1 : Frontend Inclus dans Render (Docker)

```dockerfile
# frontend/Dockerfile

FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image (Nginx)
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# frontend/nginx.conf

server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
    }
}
```

**Render dashboard** :
```
1. Créer un deuxième Web Service
2. Same repo, mais chemin = frontend/
3. Runtime: Docker
4. Environment: REACT_APP_API_URL=https://gestion-scolaire-backend.onrender.com/api
```

---

### Option 2 : Frontend sur Vercel/Netlify (Recommandé)

Meilleure DX pour React + CDN gratuit.

```
1. Aller sur vercel.com
2. Connecter repo GitHub
3. Build Settings:
   ├─ Framework: React
   ├─ Build Command: npm run build
   ├─ Output Directory: build
   
4. Environment Variables:
   REACT_APP_API_URL=https://gestion-scolaire-backend.onrender.com/api
```

**Avantages** :
- ✅ Déploiement plus rapide (statique)
- ✅ CDN global
- ✅ Gratuit pour petits projets
- ✅ Moins de conteneurs à gérer

---

## Configuration des Domaines

### Domaine principal (Render)

Render fourni automatiquement : `gestion-scolaire-backend.onrender.com`

Pour domaine personnalisé :

```
1. Aller dans Web Service settings
2. Custom Domains
3. Ajouter votre domaine
4. Pointer DNS vers Render (CNAME record)
```

---

## Logs et Monitoring

### Accéder aux Logs

**Render Dashboard** :
```
Web Service → Logs tab
↓
Voir output Gunicorn, migrations, errors
```

### Monitoring

**Render fournit** :
- CPU usage
- Memory usage
- Network I/O
- Deployment history

Pour monitoring avancé :
- Intégrer DataDog, New Relic (payant)

---

## Problèmes Courants et Solutions

### 1. Build Timeout (> 30 min)

**Symptôme** : `Build took too long and was killed`

**Causes** :
- Image Docker trop grosse
- Requirements trop lourds
- npm install lent

**Solutions** :

```dockerfile
# A. Utiliser slim image
FROM python:3.11-slim

# B. Cache multi-stage
FROM python:3.11-slim as builder
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
```

---

### 2. Out of Memory

**Symptôme** : App s'écrase aléatoirement

**Causes** :
- Instance type trop petit
- Celery workers trop nombreux

**Solutions** :

```dockerfile
# Réduire workers Gunicorn
CMD gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --worker-class sync
```

```python
# settings.py : Limiter Celery workers
CELERY_WORKER_CONCURRENCY = 2
```

Ou : Upgrader instance (Standard → Plus)

---

### 3. Static Files 404

**Symptôme** : CSS/JS non chargés

**Cause** : `collectstatic` pas tourné

**Solution** :

```dockerfile
RUN python manage.py collectstatic --noinput --clear
```

Ou en Render job avant déploiement.

---

### 4. Database Connection Refused

**Symptôme** : `could not connect to server`

**Cause** : DATABASE_URL incorrect ou service pas prêt

**Solution** :

```python
# settings.py - Retry logic
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600,
        conn_health_checks=True,  # ← Important
    )
}
```

```dockerfile
# Dockerfile - Wait for DB
RUN apt-get install -y postgresql-client

CMD while ! pg_isready -h $DATABASE_HOST -p 5432; do
        echo "Waiting for database..."
        sleep 1
    done && \
    python manage.py migrate && \
    gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

---

## Coûts sur Render

### Pricing (2024)

| Service | Free | Paid |
|---------|------|------|
| **Web Services** | ✅ (max 15 min inactif) | $7/month (Standard) |
| **PostgreSQL** | ✅ 256 MB (avec limite) | $15/month (1 GB) |
| **Redis** | ✅ 256 MB (avec limite) | $6/month |
| **Background Jobs** | ❌ | $10/month |

### Budget Estimé pour Prod

```
Petit déploiement (école):
  ├─ Web Service Standard : $7/month
  ├─ PostgreSQL 1GB : $15/month
  ├─ Redis 1GB : $6/month
  └─ Total : ~$28/month
  
Moyen (plusieurs écoles):
  ├─ Web Service Plus ($20) : $20/month
  ├─ PostgreSQL 10GB : $45/month
  ├─ Redis 10GB : $35/month
  ├─ Background Job : $10/month
  └─ Total : ~$110/month
```

---

## Alternative : AWS ECS (Conteneurs)

Si Render ne suffit pas, considérer AWS ECS :

| Aspect | Render | AWS ECS |
|--------|--------|---------|
| **Setup** | 🟢 Simple (minutes) | 🔴 Complexe (heures) |
| **Coûts** | 🟢 Transparent ($7+) | 🟡 Variable (peut être 0 avec free tier) |
| **Scalabilité** | 🟡 Manuelle | 🟢 Auto-scaling |
| **Control** | 🟡 Limité | 🟢 Total |
| **Learning Curve** | 🟢 Facile | 🔴 Difficile |

**Recommandation** : Démarrer avec Render, migrer à AWS si besoin.

---

## Checklist Déploiement Render

```
☐ Créer fichiers de configuration
  ☐ Dockerfile (backend)
  ☐ requirements.txt
  ☐ .dockerignore
  ☐ .env.production (secret)

☐ Configurer Django
  ☐ settings.py (DATABASE_URL, etc.)
  ☐ Vérifier ALLOWED_HOSTS
  ☐ Vérifier CORS

☐ Tests locaux
  ☐ docker build -t backend .
  ☐ docker-compose up
  ☐ Test app à http://localhost:8000

☐ Préparer GitHub
  ☐ Push code
  ☐ Créer branch 'production'

☐ Configurer Render
  ☐ Créer PostgreSQL
  ☐ Créer Redis
  ☐ Créer Web Service (backend)
  ☐ Ajouter variables d'env
  ☐ Mapper DATABASE_URL, REDIS_URL
  ☐ Test deployment

☐ Frontend
  ☐ Créer Web Service Render OR Vercel
  ☐ Configurer REACT_APP_API_URL
  ☐ Test frontend → backend communication

☐ Monitoring
  ☐ Vérifier logs Render
  ☐ Test migrations
  ☐ Test Celery (si applicable)

☐ Sécurité
  ☐ HTTPS activé (automatique Render)
  ☐ SECRET_KEY secret
  ☐ DEBUG=False
  ☐ ALLOWED_HOSTS correct

☐ Production
  ☐ Configurer domaine personnalisé
  ☐ SSL/TLS (gratuit)
  ☐ Backups postgres (configurés)
  ☐ Monitoring + alertes
```

---

## Résumé

| Question | Réponse |
|----------|---------|
| **Docker sur Render ?** | ✅ **OUI, recommandé** |
| **Complexité** | 🟢 Facile (15-30 min setup) |
| **Coûts** | 🟢 Abordable ($7-30/month) |
| **Scaling** | 🟡 Manuel, mais suffisant pour école |
| **Alternatives** | AWS ECS, DigitalOcean App Platform |

---

**Prochaines Étapes** :

1. Créer les fichiers Docker locaux
2. Tester avec `docker-compose up`
3. Créer compte Render.com
4. Déployer backend (PostgreSQL + Redis)
5. Déployer frontend (Vercel ou Render)
6. Configurer domaine personnalisé
7. Setup monitoring et backups

✅ **Render est parfait pour votre cas d'usage !**
