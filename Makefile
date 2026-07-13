.PHONY: help install dev prod build up down logs clean

help:
	@echo "Commandes disponibles:"
	@echo "  make install    - Installer les dépendances"
	@echo "  make dev        - Lancer l'environnement de développement"
	@echo "  make prod       - Lancer l'environnement de production"
	@echo "  make up         - Démarrer les conteneurs"
	@echo "  make down       - Arrêter les conteneurs"
	@echo "  make logs       - Afficher les logs"
	@echo "  make clean      - Nettoyer les fichiers temporaires"

install:
	docker-compose build

dev:
	docker-compose -f docker-compose.yml up

prod:
	docker-compose -f docker-compose.prod.yml up -d

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
