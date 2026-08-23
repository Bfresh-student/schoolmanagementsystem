"""
Script de rattrapage : génère les factures manquantes pour les inscriptions
déjà approved/active/validated qui n'ont jamais eu de facture, en raison du
bug `truthy` sur tuition_fee (corrigé dans signals.py) et/ou du signal
Django jamais connecté avant ce fix.

Usage :
    python manage.py shell < fix_legacy_invoices.py
"""
from apps.enrollments.models import Inscription
from apps.finance.models import Invoice
from apps.finance.services import InvoiceService

APPROVED_LIKE_STATUSES = ["approved", "active", "validated"]

created_count = 0
skipped_count = 0

for insc in Inscription.objects.filter(status__in=APPROVED_LIKE_STATUSES):
    if Invoice.objects.filter(inscription=insc).exists():
        continue  # déjà facturée, rien à faire

    amount = None

    # Priorité 1 : frais de la SchoolClass — is not None, PAS un check
    # truthy (Decimal('0.00') est falsy et serait ignoré à tort).
    if insc.school_class_id and insc.school_class.tuition_fee is not None:
        amount = insc.school_class.tuition_fee

    # Priorité 2 : frais du Course individuel (rétrocompatibilité)
    elif insc.course_id and getattr(insc.course, "fees_amount", None) is not None:
        amount = insc.course.fees_amount

    if amount is not None:
        InvoiceService.create_for_inscription(insc, amount=amount)
        created_count += 1
    else:
        skipped_count += 1
        print(
            f"[SKIP] Inscription {insc.id} (student={insc.student_id}, "
            f"school_class={insc.school_class_id}, course={insc.course_id}) : "
            f"toujours sans source de frais valide, à corriger manuellement "
            f"(renseigner school_class.tuition_fee ou course.fees_amount)."
        )

print(f"\nTerminé : {created_count} facture(s) créée(s), {skipped_count} inscription(s) ignorée(s) (voir logs ci-dessus).")
