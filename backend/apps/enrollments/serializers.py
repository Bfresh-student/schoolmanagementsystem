from rest_framework import serializers

# NOTE POUR views.py : ajouter "invoice" au .select_related() de la
# queryset de InscriptionViewSet (PAS prefetch_related("invoice_set") —
# invoice est un OneToOneField avec related_name="invoice", donc
# select_related fait un simple JOIN, plus efficace qu'un prefetch séparé).
# Sinon get_amount_paid/get_balance_due/get_invoice_id/get_invoice_status
# déclenchent chacun une requête SQL par ligne lors d'un GET
# /enrollments/inscriptions/ (liste) -> N+1 queries.
# Exemple :
#   queryset = Inscription.objects.select_related(
#       "student__user", "school_class__specialization", "course",
#       "approved_by", "invoice",
#   ).all()

from apps.enrollments.models import Inscription, InscriptionStatus
from apps.students.models import SchoolClass


class InscriptionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.get_full_name", read_only=True)
    student_first_name = serializers.CharField(source="student.user.first_name", read_only=True)
    student_last_name = serializers.CharField(source="student.user.last_name", read_only=True)
    student_phone = serializers.CharField(source="student.user.phone", read_only=True)
    student_email = serializers.CharField(source="student.user.email", read_only=True)
    student_user_id = serializers.IntegerField(source="student.user.id", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    specialization_name = serializers.CharField(source="school_class.specialization.name", read_only=True)

    # BUG CORRIGÉ (#1) : l'ancienne version utilisait
    #   tuition_fee = serializers.DecimalField(source="school_class.tuition_fee", read_only=True)
    # Quand school_class est None, DRF lève un SkipField() en interne pour un
    # champ read_only non-required : le champ "tuition_fee" DISPARAIT purement
    # et simplement de la réponse JSON (il n'est même pas à `null`).
    # C'est exactement ce que montre le payload réel fourni : l'inscription
    # id=1 (school_class: null) n'a AUCUNE clé "tuition_fee" dans sa sortie,
    # ce qui cassait toute la logique frontend qui teste `insc.tuition_fee`.
    # On passe donc par un SerializerMethodField qui renvoie explicitement
    # soit le montant, soit None — jamais un champ absent.
    tuition_fee = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    fees_amount = serializers.SerializerMethodField()

    # BUG CORRIGÉ (#4 — celui qui cause "montant payé reste à 0") :
    # amount_paid / balance_due sont des champs du modèle Invoice, PAS
    # de Inscription. Le frontend (mapInscriptionToEtudiant dans
    # script_inscription.js) les lit pourtant directement sur l'objet
    # renvoyé par GET /enrollments/inscriptions/ :
    #   montantPaye: insc.amount_paid || 0,
    #   resteAPayer: insc.balance_due ?? fees,
    # Comme ces clés n'existaient jamais dans la réponse, `insc.amount_paid`
    # était toujours `undefined` -> toujours 0, quel que soit le nombre de
    # paiements réellement enregistrés dans finance_invoice. On expose donc
    # ici la facture liée (s'il y en a une) pour que le frontend n'ait rien
    # à changer : les clés qu'il attendait déjà existent maintenant pour de
    # vrai côté API.
    amount_paid = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()
    invoice_id = serializers.SerializerMethodField()
    invoice_status = serializers.SerializerMethodField()

    class Meta:
        model = Inscription
        fields = [
            "id", "local_uuid", "student", "course", "school_class",
            "student_name", "student_first_name", "student_last_name",
            "student_phone", "student_email", "student_user_id",
            "class_name", "specialization_name", "tuition_fee",
            "course_name", "fees_amount",
            "amount_paid", "balance_due", "invoice_id", "invoice_status",
            "status", "rejection_reason",
            "requested_at", "approved_by", "approved_at",
            "activated_at", "validated_at",
            "synced", "created_offline",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "approved_by", "approved_at",
            "activated_at", "validated_at", "created_at", "updated_at",
        ]

    def get_tuition_fee(self, obj):
        """
        BUG CORRIGÉ (#2) : `is not None`, jamais un check truthy.
        Decimal('0.00') est falsy en Python -> `if sc.tuition_fee:` traite
        une formation réellement gratuite (0.00) exactement comme une
        formation sans frais renseignés (None), et fait disparaître la
        valeur alors qu'elle existe en base.
        """
        if obj.school_class_id and obj.school_class.tuition_fee is not None:
            return str(obj.school_class.tuition_fee)
        return None

    def get_course_name(self, obj):
        if obj.course:
            return obj.course.name
        if obj.school_class:
            return obj.school_class.specialization.name
        return None

    def get_fees_amount(self, obj):
        """Même correction que get_tuition_fee : is not None, pas de check truthy."""
        if obj.school_class and obj.school_class.tuition_fee is not None:
            return str(obj.school_class.tuition_fee)
        if obj.course and obj.course.fees_amount is not None:
            return str(obj.course.fees_amount)
        return None

    def _get_invoice(self, obj):
        """
        Récupère la facture liée à cette inscription, en cachant le résultat
        sur l'objet le temps de la sérialisation pour éviter de refaire la
        requête pour chaque champ (amount_paid, balance_due, invoice_id,
        invoice_status appellent tous _get_invoice).

        CORRECTION : Invoice.inscription est un OneToOneField avec
        related_name="invoice" (voir apps/finance/models.py) — PAS
        `invoice_set` (qui est le nom par défaut pour une ForeignKey
        classique sans related_name). Accéder à une relation OneToOne
        inverse non renseignée lève Invoice.DoesNotExist, pas une liste
        vide : d'où le try/except plutôt qu'un .first().
        Une inscription peut ne pas encore avoir de facture (statut
        pending, ou pas encore de tuition_fee valide) : c'est normal,
        on renvoie None dans ce cas.
        """
        if not hasattr(obj, "_cached_invoice"):
            from apps.finance.models import Invoice
            try:
                obj._cached_invoice = obj.invoice
            except Invoice.DoesNotExist:
                obj._cached_invoice = None
        return obj._cached_invoice

    def get_amount_paid(self, obj):
        invoice = self._get_invoice(obj)
        if invoice is None:
            return 0
        return str(invoice.amount_paid) if invoice.amount_paid is not None else 0

    def get_balance_due(self, obj):
        invoice = self._get_invoice(obj)
        if invoice is None:
            # Pas de facture -> on ne peut pas dire combien reste dû via
            # l'invoice ; le frontend retombe sur `fees` (tuition_fee) dans
            # ce cas via son propre `??`, ce qui reste correct.
            return None
        return str(invoice.balance_due) if invoice.balance_due is not None else None

    def get_invoice_id(self, obj):
        invoice = self._get_invoice(obj)
        return invoice.id if invoice else None

    def get_invoice_status(self, obj):
        invoice = self._get_invoice(obj)
        return invoice.status if invoice else None


class InscriptionCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur utilisé à la création, aussi bien online qu'offline.
    """
    local_uuid = serializers.UUIDField(required=False)

    # BUG CORRIGÉ (#3) : school_class suivait auparavant la nullabilité du
    # modèle (FK avec null=True côté DB), ce qui permettait de créer des
    # inscriptions SANS classe -> sans source de frais -> jamais facturées.
    # C'est la cause directe de l'inscription id=1 du payload fourni
    # (school_class: null, created_offline: true, jamais de facture,
    # jamais de montant payé possible).
    # On le rend explicitement obligatoire au niveau du serializer, sans
    # toucher au modèle (donc sans migration DB requise).
    school_class = serializers.PrimaryKeyRelatedField(
        queryset=SchoolClass.objects.all(),
        required=True,
        allow_null=False,
        error_messages={
            "required": "Une classe (school_class) est obligatoire pour créer une inscription.",
            "null": "Une classe (school_class) est obligatoire pour créer une inscription.",
        },
    )

    class Meta:
        model = Inscription
        fields = ["local_uuid", "student", "school_class", "requested_at", "created_offline"]

    def validate(self, attrs):
        local_uuid = attrs.get("local_uuid")
        if local_uuid and Inscription.objects.filter(local_uuid=local_uuid).exists():
            return attrs

        student = attrs.get("student")
        school_class = attrs.get("school_class")

        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "STUDENT":
            if not student or student.user_id != request.user.id:
                raise serializers.ValidationError(
                    {"student": "Un étudiant ne peut créer une inscription que pour lui-même."}
                )

        if student and school_class:
            # Vérification de capacité avant la recherche de doublon.
            active_statuses = [
                InscriptionStatus.PENDING,
                InscriptionStatus.APPROVED,
                InscriptionStatus.ACTIVE,
                InscriptionStatus.SUSPENDED,
            ]
            if (
                school_class.capacity
                and Inscription.objects.filter(
                    school_class=school_class, status__in=active_statuses
                ).count() >= school_class.capacity
            ):
                raise serializers.ValidationError(
                    {"school_class": "Cette classe a atteint sa capacité maximale."}
                )
            existing = Inscription.objects.filter(
                student=student,
                school_class=school_class,
                status__in=active_statuses,
            )
            #
            #
            #
            #
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    "Une inscription active existe déjà pour cet étudiant dans cette classe."
                )
        return attrs

    def create(self, validated_data):
        local_uuid = validated_data.get("local_uuid")
        if local_uuid:
            existing = Inscription.objects.filter(local_uuid=local_uuid).first()
            if existing:
                return existing
        return super().create(validated_data)


class InscriptionRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=False)


class InscriptionTransitionSerializer(serializers.Serializer):
    """Utilisé par l'action générique /transition/ pour activer, suspendre, valider..."""
    status = serializers.ChoiceField(choices=InscriptionStatus.choices)


class PreInscriptionSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le formulaire public de pré-inscription (aucun compte requis).
    Tous les champs non obligatoires sont blank=True côté modèle.
    """
    reference = serializers.CharField(read_only=True)

    class Meta:
        from apps.enrollments.models import PreInscription
        model = PreInscription
        fields = [
            "id", "reference",
            "nom", "prenom", "sexe", "date_naissance",
            "telephone", "email", "adresse", "commune", "departement",
            "programme", "promotion", "date_inscription",
            "status", "created_at"
        ]

    def validate_telephone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le numéro de téléphone est obligatoire.")
        return value.strip()