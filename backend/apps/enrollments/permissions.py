# ============================================================================
# ⚠️ MODIFICATION SUPPLÉMENTAIRE REQUISE dans apps/enrollments/views.py :
# InscriptionViewSet doit déclarer resource_name, sinon has_permission()
# ci-dessous renvoie toujours False (resource is None) -> 403 pour tous.
#
#     class InscriptionViewSet(viewsets.ModelViewSet):
#         queryset = Inscription.objects.select_related(
#             "student__user", "course", "approved_by"
#         ).all()
#         permission_classes = [InscriptionPermission]
#         resource_name = "inscriptions"          # <-- LIGNE À AJOUTER
#         ...
# ============================================================================

from rest_framework.permissions import BasePermission, SAFE_METHODS


class InscriptionPermission(BasePermission):
    """
    Matrice appliquée (cf. section Sécurité et Permissions du document) :

      - Student : peut CRÉER sa propre inscription (POST), et LIRE
        uniquement les siennes. Ne peut ni approuver, ni rejeter, ni activer.
      - Teacher : lecture seule sur les inscriptions de ses propres cours.
      - Admin : accès complet (create/read/update/approve/reject).
    """

    # Mappe une action DRF (view.action) vers un droit métier. Les actions
    # personnalisées (approve/reject/transition) sont volontairement
    # séparées de "update" pour qu'un rôle ayant "update" (ex: SECRETARY)
    # n'obtienne pas automatiquement le droit de valider un dossier.
    ACTION_TO_PERMISSION = {
        "list": "read",
        "retrieve": "read",
        "create": "create",
        "update": "update",
        "partial_update": "update",
        "destroy": "delete",
        "sync_batch": "create",
        "approve": "approve",
        "reject": "approve",
        "transition": "approve",
    }

    # Repli si view.action n'est pas disponible (ne devrait pas arriver
    # avec un ModelViewSet, mais on garde un filet de sécurité par méthode).
    ACTION_MAP = {
        "GET": "read",
        "HEAD": "read",
        "OPTIONS": "read",
        "POST": "create",
        "PUT": "update",
        "PATCH": "update",
        "DELETE": "delete",
    }

    # BUG CORRIGÉ : la clé de ressource était "courses" (copiée depuis
    # apps/courses/permissions.py) alors que cette classe protège
    # "inscriptions". Avec l'ancienne clé, .get(resource, set()) renvoyait
    # toujours un set() vide pour "inscriptions" -> 403 pour tout le monde,
    # y compris Admin. Il fallait aussi que resource_name = "inscriptions"
    # soit défini sur InscriptionViewSet (voir apps/enrollments/views.py).
    ROLE_PERMISSIONS = {
        "ADMIN":     {"inscriptions": {"create", "read", "update", "delete", "approve"}},
        "DIRECTOR":  {"inscriptions": {"create", "read", "update", "delete", "approve"}},
        "SECRETARY": {"inscriptions": {"create", "read", "update"}},
        "TEACHER":   {"inscriptions": {"read"}},
        "STUDENT":   {"inscriptions": {"create", "read"}},
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        resource = getattr(view, "resource_name", None)
        if resource is None:
            return False

        action = self.ACTION_TO_PERMISSION.get(
            getattr(view, "action", None),
            self.ACTION_MAP.get(request.method),
        )
        allowed = self.ROLE_PERMISSIONS.get(request.user.role, {}).get(resource, set())
        return action in allowed

    def has_object_permission(self, request, view, obj):
        """
        Vérifie que l'utilisateur a le droit d'accéder à CET objet
        (inscription) particulier, en plus du droit global déjà validé par
        has_permission() (donc un étudiant ne peut jamais arriver ici pour
        approve/reject/transition : has_permission() l'a déjà bloqué avant).
        """
        user = request.user
        role_name = getattr(user, "role", None)

        if role_name == "STUDENT":
            return obj.student.user == user  # ne peut voir/éditer que ses propres inscriptions

        if role_name == "TEACHER":
            return obj.course.teacher.user == user  # ne peut voir que les inscriptions de ses cours

        if role_name in ("ADMIN", "DIRECTOR", "SECRETARY"):
            return True  # accès complet

        return False  # rôle inconnu/non prévu : rien par défaut, plus sûr