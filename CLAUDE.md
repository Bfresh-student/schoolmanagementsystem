# Claude Instructions for this repository

This repository is a school-management platform with a Django backend and a vanilla JS frontend. Keep changes aligned with the architecture described in `docs/ANALYSE_SYSTEME_GESTION_SCOLAIRE.md` and `docs/STRUCTURE_PROJET.md`.

## Operating principles

- Work locally from the smallest reliable anchor: a file, symbol, failing test, or nearby implementation.
- Read the nearest code before editing.
- Keep changes focused and avoid unrelated cleanup.
- Do not introduce new frameworks or patterns unless the user asks.
- Use `apply_patch` for file edits.
- Validate after editing with the narrowest useful command or test.

## Repo layout

- `backend/` is the Django/DRF/Channels/Celery application layer.
- `frontend/` is the vanilla HTML/CSS/JS UI layer.
- `docs/` is the reference for architecture, structure, and domain rules.
- `.claude/` is where Claude-specific configuration and skills live.

## Backend rules

- Keep Django features inside `backend/apps/<domain>/`.
- Preserve the app structure already used in the repo: `models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, and tests where needed.
- Respect the offline-first design and sync-related metadata when working on syncable entities.
- Treat conflict resolution, auditability, and permissions as first-class concerns.

## Frontend rules

- Keep the frontend framework-free unless the request explicitly changes that direction.
- Favor small, composable files and native browser APIs.
- Use the existing `live-server` setup for development work.

## Command reference

- `make dev`
- `make prod`
- `make logs`
- `make clean`
- `cd backend && pytest`
- `cd frontend && npm run dev`

## Domain reminders

- Main areas include users, students, teachers, HR, courses, enrollments, grades, attendances, projects, events, finance, payments, media_center, notifications, ai_insights, and sync.
- Users and sync-critical flows deserve extra care because other parts depend on them.
- If a change spans backend and frontend, update the backend contract first, then the UI.

## When unsure

- Ask only when the request is genuinely ambiguous or destructive.
- Otherwise, inspect the closest implementation and continue with the smallest safe change.
