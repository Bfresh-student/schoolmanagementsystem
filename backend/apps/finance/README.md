# App `finance` — Intégration

## 1. Installation

Copier le dossier `finance/` à la racine du projet Django (à côté de `manage.py`).

```bash
pip install djangorestframework stripe weasyprint celery redis --break-system-packages
```

## 2. `settings.py`

```python
INSTALLED_APPS = [
    # ...
    "rest_framework",
    "students",
    "inscriptions",       # optionnel — la génération auto de facture s'active si présent
    "notifications",      # optionnel — les notifications de paiement s'activent si présent
    "finance",
]

FINANCE_DEFAULT_DUE_DAYS = 14

STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET")
PAYPAL_CLIENT_ID = env("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = env("PAYPAL_CLIENT_SECRET")
MOBILE_MONEY_WEBHOOK_SECRET = env("MOBILE_MONEY_WEBHOOK_SECRET")

CELERY_BEAT_SCHEDULE = {
    "finance-mark-overdue-invoices": {
        "task": "finance.tasks.mark_overdue_invoices_task",
        "schedule": crontab(hour=1, minute=0),  # tous les jours à 1h
    },
    "finance-payment-reminders": {
        "task": "finance.tasks.send_payment_reminders",
        "schedule": crontab(hour=8, minute=0),
    },
}
```

## 3. `urls.py` du projet

```python
urlpatterns = [
    # ...
    path("api/finance/", include("finance.urls")),
]
```

## 4. Migrations

```bash
python manage.py makemigrations finance
python manage.py migrate
```

## 5. Amorcer les moyens de paiement

```python
# Fixture ou migration de données
PaymentMethod.objects.bulk_create([
    PaymentMethod(name="Carte bancaire", code="stripe"),
    PaymentMethod(name="PayPal", code="paypal"),
    PaymentMethod(name="Mobile Money", code="mobile_money"),
    PaymentMethod(name="Virement bancaire", code="bank_transfer", is_online=False),
    PaymentMethod(name="Espèces", code="cash", is_online=False),
])
```

## Ce que couvre l'app

| Fichier | Rôle |
|---|---|
| `models.py` | `Invoice`, `Payment`, `Receipt`, `PaymentMethod`, `WebhookEvent` (idempotence) |
| `services.py` | Logique métier : numérotation, transitions de statut, traitement des webhooks |
| `signals.py` | Auto-génération de facture quand une inscription passe à `approved` |
| `tasks.py` | Tâches Celery : PDF du reçu, factures en retard, rappels d'échéance |
| `views.py` | API REST (factures/paiements en lecture, initiation, confirmation manuelle) + 3 endpoints webhook |
| `permissions.py` | Étudiant ne voit que ses données ; admin voit tout ; confirmation manuelle = admin uniquement |
| `admin.py` | Interface admin avec action "confirmer les paiements manuels" |

## Points d'attention repris de l'analyse

- **Offline** : les paiements en ligne (Stripe/PayPal) sont **impossibles hors-ligne** — le flag `Payment.synced` permet cependant à un admin de saisir un paiement **espèces** hors-ligne, remonté ensuite au serveur.
- **Idempotence** : `idempotency_key` sur `Payment` empêche la double soumission ; `WebhookEvent` empêche le double traitement d'un même événement rejoué par la passerelle.
- **Traçabilité** : chaque webhook est journalisé (`WebhookEvent`), chaque reçu a un numéro unique séquentiel par année (`RCT-2026-000001`).
- **Sécurité** : les clés secrètes des passerelles ne sont jamais stockées dans `PaymentMethod.public_config` — uniquement lues depuis les variables d'environnement côté serveur.

## Prochaine étape suggérée

Implémenter l'app `notifications` (déclencheurs `payment_received`, `invoice_due_soon`) pour que les appels `trigger_notification(...)` déjà prévus dans `services.py` et `tasks.py` prennent effet.
