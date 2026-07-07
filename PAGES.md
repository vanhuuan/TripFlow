# TripFlow Pages Documentation

## Overview
TripFlow is a trip planning app for authenticated users to create trips, manage itinerary steps, upload images, track trip status, and generate public read-only share links.

## Route Map
| Route | Page name | Component/file path | Public or protected | Main purpose |
| --- | --- | --- | --- | --- |
| `/` | Landing | `frontend/src/pages/LandingPage.tsx` | Public | Public marketing homepage that routes signed-in users into the workspace. |
| `/dashboard` | Dashboard | `frontend/src/pages/DashboardPage.tsx` | Protected | Shows the trip list and highlights the currently active trip. |
| `/trips/new` | Create trip | `frontend/src/pages/NewTripPage.tsx` | Protected | Creates a new trip. |
| `/trips/:tripId` | Trip details | `frontend/src/pages/TripDetailPage.tsx` | Protected | Shows trip details, sharing, and itinerary summary. |
| `/trips/:tripId/edit` | Edit trip | `frontend/src/pages/EditTripPage.tsx` | Protected | Updates trip metadata and cover image. |
| `/trips/:tripId/steps/edit` | Edit steps | `frontend/src/pages/TripStepsEditPage.tsx` | Protected | Bulk-edits trip steps, reorders them, and manages step images. |
| `/trips/:tripId/steps/new` | Add step | `frontend/src/pages/NewTripStepPage.tsx` | Protected | Creates a single itinerary step. |
| `/trips/:tripId/steps/:stepId/edit` | Edit step | `frontend/src/pages/EditTripStepPage.tsx` | Protected | Edits one itinerary step. |
| `/trips/:tripId/focus` | Focus mode | `frontend/src/pages/FocusModePage.tsx` | Protected | Shows the current actionable step and progress view. |
| `/share/:token` | Shared trip | `frontend/src/pages/PublicTripPage.tsx` | Public | Read-only public trip view. |
| `/login` | Login | `frontend/src/pages/LoginPage.tsx` | Public | Authenticates an existing user. |
| `/signup` | Signup | `frontend/src/pages/SignupPage.tsx` | Public | Creates a new account. |

## Pages

### Dashboard
- Route: `/dashboard`
- File: `frontend/src/pages/DashboardPage.tsx`
- Purpose: Trip landing page for authenticated users. Shows all trips and the current active trip, if one exists.
- Main UI sections: Page header, `Create trip` button, active-trip callout, loading state, empty state, and trip card grid.
- User actions: Open a trip, create a new trip, continue the active trip, or jump to trip details.
- Data shown: Trip title, destination, status, cover image, and date range.
- API/services used: `getTrips()` from `frontend/src/api/trips.ts`.
- Form fields: Not found in current code.
- Validation rules: Not found in current code.
- Loading/empty/error states: Shows `Loading trips...`; shows `No trips yet` empty state; shows `Trips could not be loaded.` on fetch failure.
- Related components: `PageHeader`, `formatDateRange`, `resolveAssetUrl`, `statusClassName`.
- Notes / TODO: No search, filtering, sorting, or pagination in the current UI.

### Create Trip
- Route: `/trips/new`
- File: `frontend/src/pages/NewTripPage.tsx`
- Purpose: Creates a new trip record.
- Main UI sections: Page header and `TripForm`.
- User actions: Fill out trip details, upload/select a cover image, and submit the form.
- Data shown: None before submission; error banner appears if the API rejects the request.
- API/services used: `createTrip()` from `frontend/src/api/trips.ts`.
- Form fields: Provided by `TripForm`.
- Validation rules: Provided by `TripForm`.
- Loading/empty/error states: Button and form show saving state; server error banner shown on submit failure.
- Related components: `PageHeader`, `TripForm`.
- Notes / TODO: On success, navigates to the newly created trip detail page.

### Edit Trip
- Route: `/trips/:tripId/edit`
- File: `frontend/src/pages/EditTripPage.tsx`
- Purpose: Loads an existing trip and updates its metadata.
- Main UI sections: Page header, loading state, not-found state, and `TripForm`.
- User actions: Edit trip details, replace the cover image, and save changes.
- Data shown: Current trip values are prefilled into the form.
- API/services used: `getTrip(tripId)` and `updateTrip(tripId, payload)` from `frontend/src/api/trips.ts`.
- Form fields: Provided by `TripForm`.
- Validation rules: Provided by `TripForm`.
- Loading/empty/error states: Shows `Loading trip...`; if the trip cannot be loaded, shows `Trip not found`; submit errors show `Trip could not be saved.` or an API message.
- Related components: `PageHeader`, `TripForm`.
- Notes / TODO: Returns to the trip detail page after save.

### Trip Details
- Route: `/trips/:tripId`
- File: `frontend/src/pages/TripDetailPage.tsx`
- Purpose: Read-only trip overview with management actions, sharing controls, and itinerary summary.
- Main UI sections: Header/status badge, trip summary card, action panel, sharing panel, and itinerary step list.
- User actions: Edit trip, start trip, complete trip, delete trip, create or disable a public share link, copy the share link, open focus mode, and open step edit.
- Data shown: Trip metadata, cover image, date range, estimated cost, description, sharing URL, and the full step list.
- API/services used: `getTrip`, `startTrip`, `completeTrip`, `deleteTrip`, `createTripShareLink`, `disableTripShareLink` from `frontend/src/api/trips.ts`.
- Form fields: Not found in current code.
- Validation rules: Not found in current code.
- Loading/empty/error states: Shows `Loading trip...`; shows `Trip not found` if the trip cannot be loaded; shows `No public share link yet.` when sharing is disabled or not created; shows `No itinerary steps yet.` when there are no steps; action failures surface as inline error banners.
- Related components: `PageHeader`, `TripStepImageCarousel`, `formatDateRange`, `formatMoney`, `resolveAssetUrl`, `statusClassName`.
- Notes / TODO: Uses the browser clipboard API for link copying and `window.confirm()` for delete confirmation.

### Edit Steps
- Route: `/trips/:tripId/steps/edit`
- File: `frontend/src/pages/TripStepsEditPage.tsx`
- Purpose: Bulk editor for itinerary steps with local reorder, inline editing, image upload, and save-all behavior.
- Main UI sections: Trip summary panel, action panel, step list editor, empty-state card, and per-step edit/summarize cards.
- User actions: Add a step, edit a step inline, reorder steps by drag and drop, upload step images, remove uploaded images, delete a step, cancel edits, and save all changes.
- Data shown: Trip header information plus each step's type, title, description, scheduled time, cost, links, and image count/previews.
- API/services used: `getTrip`, `createTripStep`, `updateTripStep`, `deleteTripStep`, `reorderTripSteps`, `startTrip`, `completeTrip`, and `uploadFile` from `frontend/src/api/trips.ts`.
- Form fields: Step type, title, scheduled date/time, cost, description, Google Maps URL, external URL, and image uploads. New blank draft cards can also be added.
- Validation rules: Title is required; cost must be zero or greater when entered; save-all blocks if any card fails validation.
- Loading/empty/error states: Shows `Loading steps...`; shows `Step list not found` if the trip is missing; shows `No itinerary steps yet.` when the list is empty; inline error banner shown on load/save/delete/upload failures.
- Related components: `PageHeader`, `TripStepImageCarousel`, `formatDateRange`, `formatMoney`, `resolveAssetUrl`, `statusClassName`.
- Notes / TODO: The page supports a `highlightStepId` in navigation state after creating a step. The `Start trip` and `Complete trip` buttons currently call the API but do not navigate or refresh local state afterward.

### Add Step
- Route: `/trips/:tripId/steps/new`
- File: `frontend/src/pages/NewTripStepPage.tsx`
- Purpose: Creates one itinerary step for an existing trip.
- Main UI sections: Page header, back link, and `TripStepForm`.
- User actions: Fill out the step form, attach images, and submit.
- Data shown: Current trip title is used in the page heading; otherwise the screen is form-driven.
- API/services used: `getTrip(tripId)` and `createTripStep(tripId, payload)` from `frontend/src/api/trips.ts`.
- Form fields: Provided by `TripStepForm`.
- Validation rules: Provided by `TripStepForm`.
- Loading/empty/error states: Shows `Loading trip...`; shows `Trip not found` if the trip cannot be loaded; submit errors show `Step could not be created.` or an API message.
- Related components: `PageHeader`, `TripStepForm`.
- Notes / TODO: On success, navigates back to step editing and highlights the newly created step.

### Edit Step
- Route: `/trips/:tripId/steps/:stepId/edit`
- File: `frontend/src/pages/EditTripStepPage.tsx`
- Purpose: Updates one itinerary step.
- Main UI sections: Page header, back link when missing, and `TripStepForm`.
- User actions: Edit step details, upload images, and save changes.
- Data shown: Current trip data plus the selected step prefilled into the form.
- API/services used: `getTrip(tripId)` and `updateTripStep(tripId, stepId, payload)` from `frontend/src/api/trips.ts`.
- Form fields: Provided by `TripStepForm`.
- Validation rules: Provided by `TripStepForm`.
- Loading/empty/error states: Shows `Loading step...`; shows `Step not found` if the trip or step cannot be loaded; submit errors show `Step could not be saved.` or an API message.
- Related components: `PageHeader`, `TripStepForm`.
- Notes / TODO: On success, returns to the trip detail page.

### Focus Mode
- Route: `/trips/:tripId/focus`
- File: `frontend/src/pages/FocusModePage.tsx`
- Purpose: Single-step "do this now" view for an active trip.
- Main UI sections: Trip progress summary, current step detail, upcoming steps list, completed/skipped list, and trip summary sidebar.
- User actions: Mark the current step done, skip it, or jump back to the trip detail page.
- Data shown: Current todo step, progress counts, upcoming steps, completed/skipped steps, and trip metadata.
- API/services used: `getTrip`, `markTripStepDone`, `skipTripStep` from `frontend/src/api/trips.ts`.
- Form fields: Not found in current code.
- Validation rules: Not found in current code.
- Loading/empty/error states: Shows `Loading focus mode...`; shows `Trip not found` if the trip cannot be loaded; when all steps are finished, shows `Trip complete`; inline error banner appears on mutation failures.
- Related components: `PageHeader`, `TripStepImageCarousel`, `formatStepDateTime`, `stepTypeIcon`, `stepTypeLabel`, `stepStatusClassName`, `statusClassName`.
- Notes / TODO: Picks the first `Todo` step by `orderIndex` as the current step.

### Shared Trip
- Route: `/share/:token`
- File: `frontend/src/pages/PublicTripPage.tsx`
- Purpose: Public read-only trip view for anyone with the share token.
- Main UI sections: Header, read-only badge, cover/summary section, current step card, upcoming steps, and completed/skipped sidebar.
- User actions: Open external links, view images, and navigate back to the dashboard. No editing actions are available.
- Data shown: Public trip metadata, estimated cost, description, current step, upcoming steps, and completed/skipped steps.
- API/services used: `getPublicTrip(token)` from `frontend/src/api/trips.ts`.
- Form fields: Not found in current code.
- Validation rules: Not found in current code.
- Loading/empty/error states: Shows `Loading shared trip...`; shows `Trip not found` if the token is invalid or disabled; when all steps are done, shows `Trip complete`; error banner appears on fetch failure.
- Related components: `PageHeader`, `TripStepImageCarousel`, `formatMoney`, `formatStepDateTime`, `stepTypeIcon`, `stepTypeLabel`.
- Notes / TODO: This route is public and does not require authentication.

### Login
- Route: `/login`
- File: `frontend/src/pages/LoginPage.tsx`
- Purpose: Signs an existing user in.
- Main UI sections: Page header, login form, submit button, and link to signup.
- User actions: Enter email/password and submit.
- Data shown: Inline field validation messages and server error banner.
- API/services used: `useAuth().login()` from `frontend/src/auth/AuthContext.tsx`.
- Form fields: Email, password.
- Validation rules: Email must be valid; password is required.
- Loading/empty/error states: Submit button shows `Logging in...`; server error banner shown on failure; field-level errors come from `react-hook-form` + `zod`.
- Related components: `PageHeader`.
- Notes / TODO: Redirects to the originally requested route when available, otherwise to `/dashboard`.

### Signup
- Route: `/signup`
- File: `frontend/src/pages/SignupPage.tsx`
- Purpose: Creates a new user account and signs the user in.
- Main UI sections: Page header, signup form, submit button, and link to login.
- User actions: Enter profile and credential details and submit.
- Data shown: Inline field validation messages and server error banner.
- API/services used: `useAuth().signup()` from `frontend/src/auth/AuthContext.tsx`.
- Form fields: Display name, email, password, confirm password.
- Validation rules: Display name must be 2-100 characters; email must be valid; password must be 8-128 characters; confirm password is required and must match password.
- Loading/empty/error states: Submit button shows `Creating account...`; server error banner shown on failure; field-level errors come from `react-hook-form` + `zod`.
- Related components: `PageHeader`.
- Notes / TODO: On success, navigates to `/dashboard`.

## Shared Layout and Navigation
- Main layout: `frontend/src/App.tsx` wraps all routes in `AuthProvider` and `AppLayout`.
- Header/sidebar/navbar: `AppLayout` provides the global header and top navigation. There is no sidebar.
- Auth-aware navigation: Logged-out users see the landing header, `Login`, and `Signup` on public surfaces. Logged-in users see `Dashboard`, `New trip`, and a `Logout` button on app surfaces.
- Protected route behavior: `ProtectedRoute` blocks access until auth loading finishes, then redirects unauthenticated users to `/login` and preserves the attempted location in `state.from`.
- Public-only route behavior: `PublicOnlyRoute` blocks `/login` and `/signup` for signed-in users and redirects them to `/dashboard`.
- Auth persistence: `AuthContext` stores token, expiration, and user data in `localStorage` under `tripflow.auth`, restores auth on page load, and refreshes the current user via `/api/auth/me`.
- API client auth: `frontend/src/api/client.ts` sets the `Authorization: Bearer <token>` header on the shared Axios client.
- Common UI components:
  - `PageHeader` for page titles and descriptions.
  - `TripForm` for create/edit trip forms, including cover image upload and crop preview.
  - `TripStepForm` for create/edit step forms, including multiple image uploads and previews.
  - `TripStepImageCarousel` for in-page image browsing plus a full-screen modal viewer.
  - `tripFormatting.ts` and `tripStepFormatting.ts` for status, date, money, and icon formatting.
- Shared component note: `TripStepCard` exists in `frontend/src/components/trips/TripStepCard.tsx`, but it is not currently imported by any page.

## Current Feature Summary
- Authentication with signup, login, logout, persisted sessions, and protected/public route handling.
- Trip dashboard with empty state, active-trip callout, and trip cards.
- Create and edit trip flows with title, destination, description, dates, currency, and cover image upload.
- Trip detail view with trip status controls, share-link management, and itinerary step summary.
- Public read-only trip sharing via tokenized URL.
- Focus mode for step-by-step trip execution with done/skip actions and progress tracking.
- Step creation, single-step editing, and bulk step editing with drag-and-drop reordering.
- Step image uploads and preview carousels.

## Missing or Future Improvements
- Add search, filters, and sorting on the dashboard.
- Replace `window.confirm()` delete prompts with a styled confirmation modal.
- Add stronger validation for URLs and dates in step forms, and surface more specific form errors.
- Refresh or navigate after `Start trip` and `Complete trip` actions in `TripStepsEditPage`.
- Add better feedback for clipboard copy and mutation success states.
- Show richer loading skeletons instead of plain text placeholders.
- Add unsaved-changes protection when leaving the step editor.
- Consider a dedicated step table or timeline view for dense itineraries.
- Add pagination or virtualization for trips and long step lists if the dataset grows.

