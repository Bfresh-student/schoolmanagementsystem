# Gemini Instructions for this repository

You are working in a school-management repository with a Django backend and a vanilla HTML/CSS/JS frontend.

## Project map

- `backend/` contains Django, DRF, Channels, Celery, pytest.
- `frontend/` contains vanilla JS served with `live-server` during development.
- `docs/` contains the architecture and project structure references.
- `.claude/` and `.gemini/` are for agent-specific guidance and skills.

## Read first

Before architecture changes or new feature work, read:

- `docs/ANALYSE_SYSTEME_GESTION_SCOLAIRE.md`
- `docs/STRUCTURE_PROJET.md`

Use those docs as the source of truth for the offline-first flow, app boundaries, and folder conventions.

## Working rules

- Start from the nearest file, symbol, failing command, or test.
- Make the smallest change that solves the request.
- Do not refactor unrelated apps or files.
- Preserve the existing style and naming patterns already present in the repo.
- Use `apply_patch` for edits.
- Validate the touched slice after editing when a narrow check exists.

## Backend conventions

- Backend code lives under `backend/apps/<app_name>/`.
- Keep Django apps isolated: models, serializers, views, urls, admin, and tests stay close together.
- Treat `users`, `students`, `teachers`, `courses`, `enrollments`, `grades`, `attendances`, `finance`, `payments`, `projects`, `events`, `media_center`, `notifications`, `ai_insights`, `hr`, and `sync` as the main domain areas.
- For syncable records, follow the offline-first pattern from the docs: include sync metadata when relevant and keep conflict handling explicit.
- Prefer DRF and the existing project layout over introducing new frameworks.

## Frontend conventions

- The frontend is intentionally vanilla JS.
- Prefer native ES modules and simple page/component organization.
- Keep UI work inside `frontend/` and avoid introducing a framework unless the user explicitly asks for one.
- The current dev server is `live-server`.

## Useful commands

- `make dev` for the local Docker stack.
- `make prod` for the production compose profile.
- `make logs` to inspect container logs.
- `cd backend && pytest` for backend tests.
- `cd frontend && npm run dev` for the frontend dev server.

## Decision style

- If a request is ambiguous, inspect the closest implementation before changing anything.
- If there are multiple plausible paths, choose the one that best matches the existing structure.
- When a larger refactor seems useful, prefer a small safe step first unless the user asked for a broader redesign.
