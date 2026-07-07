# Frontend Agent Guide

## Scope
This guide applies to everything under `frontend/`.

## Stack
- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form

## Entry Points
- App bootstrap: `src/main.tsx`
- Routing and layouts: `src/layouts/`
- Pages: `src/pages/`
- Shared UI: `src/components/`
- API client code: `src/api/`

## Working Rules
- Prefer function components and hooks.
- Keep UI changes responsive at mobile, tablet, and desktop widths.
- Match the existing visual system: teal/stone palette, rounded cards, soft shadows, and careful spacing.
- Use the existing `useI18n` helpers for visible copy.
- Vietnamese is the default language unless a task explicitly says otherwise.
- Do not introduce new design systems or alternate visual languages unless requested.
- Use existing shared components before creating new ones.

## Implementation Conventions
- Keep route-level changes in page components.
- Keep formatting and display helpers in `src/components/trips/` or similarly scoped helpers.
- Prefer small, reusable components over duplicated JSX.
- Keep interactive elements keyboard-accessible and preserve current navigation behavior.
- If you add UI polish, keep it subtle and consistent with the repo's current motion and shadow patterns.

## Verification
- Run `npm run build`
- Run `npm run lint`
- If a page or flow changed, open it in the browser and confirm responsive behavior and auth redirects

## Notes
- Frontend env vars use the `VITE_` prefix.
- Do not commit build output or local environment files.

