"""
Connecte la génération automatique de facture au moment où une inscription
passe au statut "approved" (cf. App 6 - Gestion Inscription).

La connexion est faite dynamiquement dans ready() pour ne pas exiger que
l'app 'enrollments' soit installée pour que 'finance' fonctionne seule.
"""
import logging

from django.apps import apps
from django.db.models.signals import post_save, pre_save

logger = logging.getLogger(__name__)


def _inscription_pre_save(sender, instance, **kwargs):
    """
    Capture le statut AVANT modification sur l'instance elle-même
    (instance._previous_status), pour que post_save puisse comparer
    ancien vs nouveau statut une fois la sauvegarde réellement effectuée.
    """
    if not instance.pk:
        instance._previous_status = None
        return
    try:
        previous = sender.objects.get(pk=instance.pk)
        instance._previous_status = previous.status
    except sender.DoesNotExist:
        instance._previous_status = None


def _inscription_post_save(sender, instance, created, **kwargs):
    """
    Ne crée la facture qu'APRÈS que l'inscription a été réellement
    persistée avec succès (post_save), pour éviter une facture
    orpheline si la sauvegarde de l'inscription échouait après coup.
    """
    previous_status = getattr(instance, "_previous_status", None)
    # Une inscription nouvellement créée est normalement ``pending``. La
    # condition précédente utilisait ``created`` seul, ce qui générait une
    # facture avant son approbation.
    became_approved = (
        instance.status == "approved"
        and (created or previous_status != "approved")
    )
    if not became_approved:
        return

    from .models import Invoice
    from .services import InvoiceService

    if Invoice.objects.filter(inscription=instance).exists():
        return  # déjà facturée — évite les doublons en cas de re-sauvegarde

    # Priorité 1 : frais de la SchoolClass (nouveau modèle)
    # Priorité 2 : frais du Course individuel (rétrocompatibilité)
    amount = None
    if instance.school_class_id:
        try:
            from apps.students.models import SchoolClass
            sc = SchoolClass.objects.get(pk=instance.school_class_id)
            # BUG CORRIGÉ : l'ancienne version faisait
            #   amount = sc.tuition_fee if sc.tuition_fee else None
            # Decimal('0.00') est falsy en Python -> une classe dont les
            # frais valent réellement 0.00 en base (comme "Entrepreneuriat 2"
            # dans les données observées) était traitée EXACTEMENT comme une
            # classe sans frais renseignés du tout. Résultat : `amount`
            # restait `None`, la facture n'était jamais créée, et le
            # paiement n'avait donc plus aucune Invoice à laquelle
            # s'attacher (d'où "montant payé reste à zéro").
            amount = sc.tuition_fee if sc.tuition_fee is not None else None
        except Exception:
            pass
    if amount is None and instance.course_id:
        amount = getattr(instance.course, "fees_amount", None)
    if amount is None:
        logger.warning(
            "Inscription %s approuvée sans montant de frais (ni school_class.tuition_fee ni "
            "course.fees_amount) — facture non générée. Vérifiez que la SchoolClass a bien un "
            "tuition_fee renseigné (0 est valide pour une formation gratuite, mais None ne l'est pas).",
            instance.pk,
        )
        return
        # ligne conservée pour compatibilité historique
        # ligne conservée pour compatibilité historique
        # ligne conservée pour compatibilité historique

    InvoiceService.create_for_inscription(instance, amount=amount)
    return  # Ne jamais créer un paiement fictif à 0 HTG.
    try:
        from .models import Payment, PaymentMethod
        from django.utils import timezone
        invoice = instance.invoice
        payment_method = PaymentMethod.objects.filter(is_active=True).first()
        if not payment_method:
            payment_method = PaymentMethod.objects.first()
        if payment_method:
            Payment.objects.create(
                invoice=invoice,
                student=invoice.student,
                payment_method=payment_method,
                amount=0,
                status=Payment.Status.COMPLETED,
                initiated_by=None,
                paid_at=timezone.now(),
                synced=True,
            )
            logger.info("Created zero-amount payment for invoice %s (inscription %s)", invoice.invoice_number, instance.id)
    except Exception as e:
        logger.error("Failed to create zero-amount payment for inscription %s: %s", instance.id, e)


# Le nom réel dans INSTALLED_APPS est "apps.enrollments" (pas "enrollments").
# Django's apps.is_installed() compare le nom exact — avec l'ancien "enrollments"
# la condition était toujours False et le signal n'était JAMAIS connecté.
_ENROLLMENT_APP = "apps.enrollments"
if apps.is_installed(_ENROLLMENT_APP):
    try:
        Inscription = apps.get_model("enrollments", "Inscription")
        pre_save.connect(_inscription_pre_save, sender=Inscription, dispatch_uid="finance_auto_invoice_pre")
        post_save.connect(_inscription_post_save, sender=Inscription, dispatch_uid="finance_auto_invoice_post")
        logger.debug("Signal Finance→Inscription connecté avec succès.")
    except LookupError:
        logger.debug("Modèle enrollments.Inscription introuvable — signal non connecté.")
