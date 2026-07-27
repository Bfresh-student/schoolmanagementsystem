"""
Connecte la génération automatique de facture au moment où une inscription
passe au statut "approved" (cf. App 6 - Gestion Inscription).

La connexion est faite dynamiquement dans ready() pour ne pas exiger que
l'app 'inscriptions' soit installée pour que 'finance' fonctionne seule.
"""
import logging

from django.apps import apps
from django.db.models.signals import pre_save

logger = logging.getLogger(__name__)


def _inscription_pre_save(sender, instance, **kwargs):
    if not instance.pk:
        return  # nouvelle inscription : rien à facturer pour l'instant

    try:
        previous = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    became_approved = previous.status != "approved" and instance.status == "approved"
    if not became_approved:
        return

    from .models import Invoice
    from .services import InvoiceService

    if Invoice.objects.filter(inscription=instance).exists():
        return  # déjà facturée — évite les doublons en cas de re-sauvegarde

    amount = getattr(instance.course, "fees", None)
    if amount is None:
        logger.warning(
            "Inscription %s approuvée sans montant de frais trouvé sur le cours — facture non générée.",
            instance.pk,
        )
        return

    InvoiceService.create_for_inscription(instance, amount=amount)


if apps.is_installed("inscriptions"):
    try:
        Inscription = apps.get_model("inscriptions", "Inscription")
        pre_save.connect(_inscription_pre_save, sender=Inscription, dispatch_uid="finance_auto_invoice")
    except LookupError:
        logger.debug("Modèle inscriptions.Inscription introuvable — signal non connecté.")
