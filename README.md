# Gestion Scolaire

Plateforme complète de gestion scolaire développée avec Django, DRF et une interface frontend moderne.

## Structure du projet

- **backend/** - API Django REST Framework avec Channels et Celery
- **frontend/** - Interface utilisateur HTML/CSS/JS vanilla avec PWA
- **.claude/** - Configuration des agents IA et skills custom
- **infra/** - Configuration Docker, Nginx et CI/CD
- **docs/** - Documentation technique et fonctionnelle
- **scripts/** - Scripts d'automatisation

## Démarrage rapide

### Avec Docker

```bash
docker-compose up
```

### Mode développement

```bash
make dev
```

### Mode production

```bash
make prod
```

## Configuration

1. Copier `.env.example` en `.env`
2. Configurer les variables d'environnement
3. Lancer les conteneurs

## Documentation

Voir le dossier `docs/` pour la documentation complète.
