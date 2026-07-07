# TripFlow Agent Guide

## Purpose
This repository contains two active projects:
- `frontend/` for the React + Vite UI
- `backend/` for the .NET 10 Web API

Use this file as the shared, repo-wide operating guide. Read the project-specific `AGENTS.md` inside the relevant app before making changes there.

## Working Rules
- Inspect the relevant code before editing.
- Preserve user changes and do not revert files you did not touch.
- Use `apply_patch` for manual edits.
- Prefer `rg` for searching and `rg --files` for file discovery.
- Avoid destructive git commands such as `git reset --hard` or `git checkout --`.
- Keep changes scoped to the requested task; do not refactor unrelated code.
- If a change touches both apps, update the relevant project guide or docs only if the change affects future workflow.

## Repo Layout
- `frontend/`: UI, routing, styling, and client-side state
- `backend/`: API, services, EF Core, and database integration
- `docs/`: setup notes and supporting documentation
- `plan/`: epic and planning notes

## Verification
- Frontend changes: run `npm run build` and `npm run lint` from `frontend/`
- Backend changes: run `dotnet build` from `backend/`
- If behavior changed, verify the affected user flow manually as well

## Shared Conventions
- Prefer clear, minimal changes over broad rewrites.
- Keep configuration and secrets out of source control.
- When in doubt, follow the existing style in the nearest file.
- Update docs only when the behavior or workflow actually changes.
