"""
Read-only tool layer for the AI assistant.

Design:
- Every tool call runs as the SAME Django user who created the
  InsightRequest (pass-through of their identity/permissions) — not a
  generic service account.
- We don't forward the literal JWT string: by the time a Celery worker
  picks up the task, the short-lived access token may already have
  expired. Instead we pass the user's id into the task and rebuild an
  authenticated DRF request in-process with force_authenticate(). That
  request is dispatched to the *exact* ViewSet classes used by the real
  API, so every RBAC rule already defined in students/permissions.py,
  grades/permissions.py, attendances/permissions.py, etc. is enforced
  identically for the assistant as it would be for a human hitting the
  endpoint directly with their own JWT.
- `_dispatch` is the single choke point every tool goes through, and it
  only ever maps onto 'list' / 'retrieve'. There is no code path here
  capable of invoking create/update/partial_update/destroy — the model
  cannot be handed a tool it could use to write.
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlencode

from rest_framework.test import APIRequestFactory, force_authenticate

logger = logging.getLogger(__name__)

_factory = APIRequestFactory()

# Hard cap enforced regardless of whatever pagination is (or isn't —
# this project sets none globally) configured on the underlying view, so a
# single tool call can never dump an entire table into the model's context.
MAX_RESULTS_PER_CALL = 25


def _dispatch(
    user,
    viewset_class,
    action: str,
    *,
    pk: str | None = None,
    query_params: dict | None = None,
) -> Any:
    """Run `action` ('list' or 'retrieve') on `viewset_class` as `user`.

    Structurally read-only: the only HTTP verb ever bound to the view here
    is GET, mapped to 'list' or 'retrieve'. No other action name is
    accepted, so this function cannot be repurposed into a write path.
    """
    if action not in ("list", "retrieve"):
        raise ValueError(f"Read-only dispatcher refuses non-list/retrieve action: {action!r}")

    path = "/"
    if query_params:
        clean_params = {k: v for k, v in query_params.items() if v not in (None, "")}
        if clean_params:
            path = f"/?{urlencode(clean_params)}"

    request = _factory.get(path)
    force_authenticate(request, user=user)

    view = viewset_class.as_view({"get": action})
    response = view(request, pk=pk) if pk is not None else view(request)

    if response.status_code >= 400:
        return {"error": True, "status_code": response.status_code, "detail": response.data}

    data = response.data
    if isinstance(data, dict) and "results" in data:  # paginated response shape
        data = dict(data)
        data["results"] = data["results"][:MAX_RESULTS_PER_CALL]
        return data
    if isinstance(data, list):
        return {"results": data[:MAX_RESULTS_PER_CALL], "truncated": len(data) > MAX_RESULTS_PER_CALL}
    return data


# --------------------------------------------------------------------------
# Individual tools. Each one is a thin, explicit wrapper around _dispatch —
# add new tools by adding new small functions here, never by widening
# _dispatch itself.
# --------------------------------------------------------------------------

def list_students(user, *, status=None, specialization=None, school_class=None,
                   academic_year=None, search=None, **_ignored):
    from apps.students.views import StudentViewSet
    return _dispatch(user, StudentViewSet, "list", query_params={
        "status": status, "specialization": specialization,
        "school_class": school_class, "academic_year": academic_year, "search": search,
    })


def get_student(user, *, student_id, **_ignored):
    from apps.students.views import StudentViewSet
    return _dispatch(user, StudentViewSet, "retrieve", pk=student_id)


def list_grades(user, *, school_class=None, academic_year=None, **_ignored):
    from apps.grades.views import GradeViewSet
    return _dispatch(user, GradeViewSet, "list", query_params={
        "school_class": school_class, "academic_year": academic_year,
    })


def list_attendances(user, *, course_id=None, date=None, **_ignored):
    from apps.attendances.views import AttendanceViewSet
    return _dispatch(user, AttendanceViewSet, "list", query_params={
        "course_id": course_id, "date": date,
    })


def list_courses(user, **_ignored):
    from apps.courses.views import CourseViewSet
    return _dispatch(user, CourseViewSet, "list")


def list_teachers(user, **_ignored):
    from apps.teachers.views import TeacherViewSet
    return _dispatch(user, TeacherViewSet, "list")


# --------------------------------------------------------------------------
# Registry consumed by tasks.py. Keep declarations in Gemini's
# FunctionDeclaration shape (JSON-schema-like `parameters`).
# --------------------------------------------------------------------------

TOOL_REGISTRY: dict[str, dict] = {
    "list_students": {
        "fn": list_students,
        "declaration": {
            "name": "list_students",
            "description": "Liste les élèves visibles par l'utilisateur courant (filtrée automatiquement selon son rôle). Filtres optionnels.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "status": {"type": "STRING", "description": "ACTIVE, INACTIVE, SUSPENDED..."},
                    "specialization": {"type": "STRING", "description": "ID de la filière"},
                    "school_class": {"type": "STRING", "description": "ID de la classe"},
                    "academic_year": {"type": "STRING", "description": "Label de l'année académique"},
                    "search": {"type": "STRING", "description": "Recherche par nom, email ou matricule"},
                },
            },
        },
    },
    "get_student": {
        "fn": get_student,
        "declaration": {
            "name": "get_student",
            "description": "Récupère le profil détaillé d'un élève par son ID (soumis aux mêmes règles de visibilité que l'API).",
            "parameters": {
                "type": "OBJECT",
                "properties": {"student_id": {"type": "STRING"}},
                "required": ["student_id"],
            },
        },
    },
    "list_grades": {
        "fn": list_grades,
        "declaration": {
            "name": "list_grades",
            "description": "Liste les notes visibles par l'utilisateur courant (un professeur ne voit que ses cours, un élève que les siennes).",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "school_class": {"type": "STRING"},
                    "academic_year": {"type": "STRING"},
                },
            },
        },
    },
    "list_attendances": {
        "fn": list_attendances,
        "declaration": {
            "name": "list_attendances",
            "description": "Liste les présences/absences visibles par l'utilisateur courant.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "course_id": {"type": "STRING"},
                    "date": {"type": "STRING", "description": "Format YYYY-MM-DD"},
                },
            },
        },
    },
    "list_courses": {
        "fn": list_courses,
        "declaration": {
            "name": "list_courses",
            "description": "Liste les cours visibles par l'utilisateur courant.",
            "parameters": {"type": "OBJECT", "properties": {}},
        },
    },
    "list_teachers": {
        "fn": list_teachers,
        "declaration": {
            "name": "list_teachers",
            "description": "Liste les professeurs.",
            "parameters": {"type": "OBJECT", "properties": {}},
        },
    },
}


def get_gemini_tool_declarations() -> list[dict]:
    return [spec["declaration"] for spec in TOOL_REGISTRY.values()]


def execute_tool(name: str, args: dict, *, user) -> Any:
    spec = TOOL_REGISTRY.get(name)
    if spec is None:
        return {"error": True, "detail": f"Unknown tool: {name}"}
    try:
        return spec["fn"](user, **args)
    except TypeError as exc:
        return {"error": True, "detail": f"Bad arguments for {name}: {exc}"}
    except Exception:
        logger.exception("Tool %s failed for user %s", name, getattr(user, "id", None))
        return {"error": True, "detail": "Internal error executing tool"}