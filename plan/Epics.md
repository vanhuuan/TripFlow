# TripFlow Jira Cards

## Epic 1: Project Foundation

---

### TRIP-001 — Set up full-stack project structure

**Description**

Create the initial project structure for the TripFlow web application.

The project should include a frontend React application, a backend .NET Web API, and a documentation folder.

**Scope**

* Create root project folder
* Create `/frontend`
* Create `/backend`
* Create `/docs`
* Add base README
* Add `.gitignore`
* Add basic environment file examples

**Acceptance Criteria**

* Frontend app can run locally
* Backend app can run locally
* README includes setup instructions
* Folder structure is clean and ready for development

---

### TRIP-002 — Set up frontend with React, Vite, TypeScript, and Tailwind

**Description**

Initialize the frontend application using React, Vite, TypeScript, and Tailwind CSS.

**Scope**

* Create React Vite project
* Configure TypeScript
* Configure Tailwind CSS
* Add base layout
* Add basic routing structure
* Install required packages

**Suggested Packages**

* `react-router-dom`
* `axios`
* `tailwindcss`
* `lucide-react`
* `react-hook-form`
* `zod`

**Acceptance Criteria**

* Frontend starts with `npm run dev`
* Tailwind styling works
* App has base routes configured
* No TypeScript errors

---

### TRIP-003 — Set up backend with .NET 8 Web API

**Description**

Initialize the backend API using .NET 8 Web API.

**Scope**

* Create .NET 8 Web API project
* Add basic controller structure
* Add Swagger
* Add appsettings files
* Add environment-based configuration
* Add health check endpoint

**Acceptance Criteria**

* Backend starts with `dotnet run`
* Swagger is available
* Health check endpoint returns success
* Project has clean folder structure

---

### TRIP-004 — Configure database and Entity Framework Core

**Description**

Configure database access using Entity Framework Core.

**Scope**

* Add EF Core packages
* Configure database connection string
* Create application database context
* Add migration setup
* Add initial migration command documentation

**Acceptance Criteria**

* Backend can connect to database
* EF Core migration can be created
* Database update command works
* Connection string is configurable by environment

---

## Epic 2: Authentication

---

### TRIP-005 — Create User entity and authentication models

**Description**

Create the user model and authentication-related request/response DTOs.

**Scope**

* Create `User` entity
* Add email
* Add display name
* Add password hash
* Add created date
* Add auth request DTOs
* Add auth response DTOs

**Acceptance Criteria**

* User table can be created in database
* User model supports login and signup flow
* DTOs are separated from entity models

---

### TRIP-006 — Implement user signup API

**Description**

Implement the signup endpoint for new users.

**API**

```http
POST /api/auth/signup
```

**Scope**

* Validate email
* Validate password
* Validate display name
* Check duplicate email
* Hash password securely
* Save new user
* Return user info and JWT token

**Acceptance Criteria**

* User can create an account
* Duplicate email is rejected
* Password is not stored as plain text
* Successful signup returns JWT token

---

### TRIP-007 — Implement user login API

**Description**

Implement the login endpoint for existing users.

**API**

```http
POST /api/auth/login
```

**Scope**

* Validate email and password
* Check password hash
* Return JWT token
* Return basic user information

**Acceptance Criteria**

* User can log in with valid credentials
* Invalid credentials return proper error
* Successful login returns JWT token
* Password is never returned in API response

---

### TRIP-008 — Implement current user API

**Description**

Implement an endpoint to return the currently logged-in user.

**API**

```http
GET /api/auth/me
```

**Scope**

* Read user ID from JWT
* Return current user profile
* Protect endpoint with authentication

**Acceptance Criteria**

* Authenticated user can get their profile
* Anonymous request is rejected
* Returned data does not include password hash

---

### TRIP-009 — Add JWT authentication middleware

**Description**

Configure JWT authentication for protected backend APIs.

**Scope**

* Configure JWT settings
* Add authentication middleware
* Add authorization middleware
* Protect trip and trip step endpoints
* Add helper for current user ID

**Acceptance Criteria**

* Protected APIs require valid token
* Invalid token returns unauthorized
* Backend can identify current user from JWT

---

## Epic 3: Trip Management

---

### TRIP-010 — Create Trip entity and TripStatus enum

**Description**

Create the core Trip entity.

**Scope**

* Create `Trip` entity
* Create `TripStatus` enum
* Add relationship between User and Trip
* Add EF Core configuration

**Trip Fields**

* ID
* User ID
* Title
* Destination
* Description
* Start date
* End date
* Cover image URL
* Status
* Created date
* Updated date

**Acceptance Criteria**

* Trip table is created
* Trip belongs to a user
* Trip status supports Draft, Active, and Completed
* Trip entity is included in database context

---

### TRIP-011 — Implement create trip API

**Description**

Allow authenticated users to create a new trip.

**API**

```http
POST /api/trips
```

**Scope**

* Validate trip title
* Validate destination
* Save trip under current user
* Default status to Draft
* Return created trip

**Acceptance Criteria**

* Authenticated user can create trip
* Anonymous user cannot create trip
* New trip belongs to current user
* New trip has Draft status by default

---

### TRIP-012 — Implement get trips API

**Description**

Return all trips owned by the current user.

**API**

```http
GET /api/trips
```

**Scope**

* Return only current user's trips
* Sort by start date or created date
* Include trip status
* Include cover image URL

**Acceptance Criteria**

* User only sees their own trips
* Trip list returns required fields
* Anonymous request is rejected

---

### TRIP-013 — Implement get trip detail API

**Description**

Return detailed information for a selected trip.

**API**

```http
GET /api/trips/{tripId}
```

**Scope**

* Get trip by ID
* Validate ownership
* Include ordered trip steps
* Return full trip detail

**Acceptance Criteria**

* User can view their own trip
* User cannot view another user's trip
* Trip steps are ordered by order index
* Not found is returned for invalid trip ID

---

### TRIP-014 — Implement update trip API

**Description**

Allow users to update trip information.

**API**

```http
PUT /api/trips/{tripId}
```

**Scope**

* Validate ownership
* Update title
* Update destination
* Update description
* Update start date
* Update end date
* Update cover image URL
* Update modified date

**Acceptance Criteria**

* User can update their own trip
* User cannot update another user's trip
* Updated date is changed
* Invalid data returns validation error

---

### TRIP-015 — Implement delete trip API

**Description**

Allow users to delete a trip.

**API**

```http
DELETE /api/trips/{tripId}
```

**Scope**

* Validate ownership
* Delete trip
* Delete related trip steps
* Return success response

**Acceptance Criteria**

* User can delete their own trip
* User cannot delete another user's trip
* Related trip steps are removed
* Deleted trip no longer appears in dashboard

---

### TRIP-016 — Implement start trip API

**Description**

Allow users to start a trip and move it into active mode.

**API**

```http
POST /api/trips/{tripId}/start
```

**Scope**

* Validate ownership
* Change trip status to Active
* Optionally set other active trips to Draft or Completed later
* Return updated trip

**Acceptance Criteria**

* User can start their own trip
* Trip status changes to Active
* Started trip can be opened in focus mode

---

### TRIP-017 — Implement complete trip API

**Description**

Allow users to mark a trip as completed.

**API**

```http
POST /api/trips/{tripId}/complete
```

**Scope**

* Validate ownership
* Change trip status to Completed
* Return updated trip

**Acceptance Criteria**

* User can complete their own trip
* Trip status changes to Completed
* Completed trip no longer appears as active

---

## Epic 4: Trip Step Management

---

### TRIP-018 — Create TripStep entity and enums

**Description**

Create the TripStep entity used to store itinerary items.

**Scope**

* Create `TripStep` entity
* Create `TripStepType` enum
* Create `TripStepStatus` enum
* Add relationship between Trip and TripStep
* Add EF Core configuration

**TripStep Types**

* Place
* Transport
* Hotel
* Restaurant
* Activity
* Note

**TripStep Statuses**

* Todo
* Done
* Skipped

**Acceptance Criteria**

* TripStep table is created
* TripStep belongs to a Trip
* Step type and status are supported
* TripStep has order index field

---

### TRIP-019 — Implement create trip step API

**Description**

Allow users to add a new itinerary step to a trip.

**API**

```http
POST /api/trips/{tripId}/steps
```

**Scope**

* Validate trip ownership
* Add new step to trip
* Set default status to Todo
* Set default order index to end of list
* Save Google Maps URL if provided
* Save ticket image URL if provided
* Save place image URL if provided

**Acceptance Criteria**

* User can add step to their own trip
* New step appears at the end of itinerary
* Step supports place, ticket, hotel, restaurant, activity, and note data
* User cannot add step to another user's trip

---

### TRIP-020 — Implement get trip steps API

**Description**

Return all steps for a selected trip.

**API**

```http
GET /api/trips/{tripId}/steps
```

**Scope**

* Validate trip ownership
* Return ordered steps
* Include all step fields

**Acceptance Criteria**

* User can view steps for their own trip
* Steps are ordered by order index
* User cannot view steps from another user's trip

---

### TRIP-021 — Implement update trip step API

**Description**

Allow users to update a trip step.

**API**

```http
PUT /api/trips/{tripId}/steps/{stepId}
```

**Scope**

* Validate trip ownership
* Validate step belongs to trip
* Update title
* Update description
* Update type
* Update scheduled date/time
* Update Google Maps URL
* Update external URL
* Update ticket image URL
* Update place image URL

**Acceptance Criteria**

* User can update their own trip step
* User cannot update another user's trip step
* Step updated date is changed
* Invalid step ID returns not found

---

### TRIP-022 — Implement delete trip step API

**Description**

Allow users to delete a step from a trip.

**API**

```http
DELETE /api/trips/{tripId}/steps/{stepId}
```

**Scope**

* Validate trip ownership
* Validate step belongs to trip
* Delete step
* Recalculate or preserve order indexes

**Acceptance Criteria**

* User can delete their own step
* Deleted step no longer appears in itinerary
* User cannot delete another user's step

---

### TRIP-023 — Implement reorder trip steps API

**Description**

Allow users to reorder itinerary steps.

**API**

```http
POST /api/trips/{tripId}/steps/reorder
```

**Request Example**

```json
{
  "stepIds": ["step-1", "step-2", "step-3"]
}
```

**Scope**

* Validate trip ownership
* Validate all step IDs belong to trip
* Update order indexes based on submitted list

**Acceptance Criteria**

* User can reorder their own trip steps
* Order is saved after refresh
* Invalid step IDs return validation error

---

### TRIP-024 — Implement mark step as done API

**Description**

Allow users to mark a trip step as done.

**API**

```http
POST /api/trips/{tripId}/steps/{stepId}/done
```

**Scope**

* Validate trip ownership
* Validate step belongs to trip
* Change step status to Done

**Acceptance Criteria**

* User can mark step as done
* Done step is reflected in focus mode
* User cannot update another user's step

---

### TRIP-025 — Implement skip step API

**Description**

Allow users to skip a trip step.

**API**

```http
POST /api/trips/{tripId}/steps/{stepId}/skip
```

**Scope**

* Validate trip ownership
* Validate step belongs to trip
* Change step status to Skipped

**Acceptance Criteria**

* User can skip step
* Skipped step is reflected in focus mode
* User cannot update another user's step

---

## Epic 5: File Upload

---

### TRIP-026 — Implement image upload API

**Description**

Create an API for uploading ticket images, place images, and trip cover images.

**API**

```http
POST /api/files/upload
```

**Scope**

* Accept image files only
* Support JPG, JPEG, PNG, WEBP
* Reject invalid file types
* Limit file size to 5MB
* Save files locally under `/uploads`
* Return public file URL

**Acceptance Criteria**

* User can upload valid image
* Invalid file type is rejected
* Large file is rejected
* API returns usable image URL

---

### TRIP-027 — Serve uploaded files publicly

**Description**

Configure backend to serve uploaded files.

**Scope**

* Add static file serving
* Expose `/uploads` path
* Ensure uploaded image URLs can be viewed from frontend

**Acceptance Criteria**

* Uploaded image URL opens in browser
* Frontend can display uploaded images
* Missing files return not found

---

### TRIP-028 — Prepare storage abstraction for future Azure Blob

**Description**

Create a storage service abstraction so local upload can be replaced by Azure Blob later.

**Scope**

* Create `IFileStorageService`
* Create `LocalFileStorageService`
* Move upload logic into service
* Keep controller simple

**Acceptance Criteria**

* File upload still works
* Storage logic is not inside controller
* Future Azure Blob implementation can be added easily

---

## Epic 6: Frontend Authentication

---

### TRIP-029 — Build login page

**Description**

Create the login page for existing users.

**Scope**

* Email input
* Password input
* Submit button
* Validation
* Call login API
* Store JWT token
* Redirect to dashboard after login

**Acceptance Criteria**

* User can log in from UI
* Invalid login shows error message
* Successful login redirects to dashboard
* Token is stored correctly

---

### TRIP-030 — Build signup page

**Description**

Create the signup page for new users.

**Scope**

* Display name input
* Email input
* Password input
* Confirm password input
* Validation
* Call signup API
* Store JWT token
* Redirect to dashboard after signup

**Acceptance Criteria**

* User can create account from UI
* Duplicate email shows error
* Password mismatch shows validation error
* Successful signup redirects to dashboard

---

### TRIP-031 — Implement frontend auth state

**Description**

Create frontend authentication state management.

**Scope**

* Create auth context or hook
* Store current user
* Store JWT token
* Load current user on app start
* Add logout function

**Acceptance Criteria**

* App knows whether user is logged in
* User remains logged in after refresh
* Logout clears token and redirects to login

---

### TRIP-032 — Add protected routes

**Description**

Protect authenticated frontend pages.

**Scope**

* Create `ProtectedRoute` component
* Redirect anonymous users to login
* Allow authenticated users to access dashboard and trip pages

**Acceptance Criteria**

* Anonymous user cannot access dashboard
* Anonymous user cannot access trip pages
* Logged-in user can access protected pages

---

## Epic 7: Frontend Trip Management

---

### TRIP-033 — Build dashboard page

**Description**

Create the main dashboard where users can see their trips.

**Scope**

* Fetch trips from API
* Show trip cards
* Show trip title
* Show destination
* Show date range
* Show status
* Show cover image if available
* Add create trip button

**Acceptance Criteria**

* User can see their own trips
* User can open trip detail
* User can create new trip from dashboard
* Empty state is shown when no trips exist

---

### TRIP-034 — Build create trip page

**Description**

Create a form for creating a new trip.

**Scope**

* Title field
* Destination field
* Description field
* Start date field
* End date field
* Cover image upload field
* Submit button

**Acceptance Criteria**

* User can create trip from UI
* Required fields are validated
* Created trip appears in dashboard
* User is redirected to trip detail after creation

---

### TRIP-035 — Build edit trip page

**Description**

Create a form for editing an existing trip.

**Scope**

* Load existing trip data
* Update trip fields
* Upload or change cover image
* Save changes

**Acceptance Criteria**

* User can edit trip information
* Updated trip data is displayed correctly
* Validation errors are shown
* User cannot edit non-existing trip

---

### TRIP-036 — Build trip detail page

**Description**

Create the trip detail page where users manage itinerary steps.

**Scope**

* Show trip information
* Show trip status
* Show ordered steps
* Add step button
* Edit trip button
* Delete trip button
* Start trip button
* Complete trip button

**Acceptance Criteria**

* Trip detail loads correctly
* Steps are displayed in order
* User can access add/edit step actions
* User can start trip from this page

---

### TRIP-037 — Add delete trip UI

**Description**

Allow users to delete a trip from the UI.

**Scope**

* Add delete button
* Add confirmation dialog
* Call delete API
* Redirect to dashboard after deletion

**Acceptance Criteria**

* User is asked to confirm before delete
* Deleted trip disappears from dashboard
* Cancel does not delete trip

---

## Epic 8: Frontend Trip Step Management

---

### TRIP-038 — Build add trip step form

**Description**

Create a form or modal for adding itinerary steps.

**Scope**

* Step type select
* Title field
* Description field
* Scheduled date/time field
* Google Maps URL field
* External URL field
* Ticket image upload
* Place image upload

**Acceptance Criteria**

* User can add a step from trip detail page
* Required fields are validated
* New step appears in itinerary
* Image preview works after upload

---

### TRIP-039 — Build edit trip step form

**Description**

Allow users to edit an existing itinerary step.

**Scope**

* Load existing step data
* Update step fields
* Update image URLs
* Save changes

**Acceptance Criteria**

* User can edit a step
* Updated step is reflected in itinerary
* Validation errors are displayed
* Cancel returns to trip detail without saving

---

### TRIP-040 — Build trip step card component

**Description**

Create a reusable card component for displaying itinerary steps.

**Scope**

* Show step type icon
* Show title
* Show scheduled time
* Show description
* Show Google Maps button if URL exists
* Show ticket button if ticket image exists
* Show place image preview if image exists
* Show status

**Acceptance Criteria**

* Step card displays correct data
* Map button opens Google Maps URL
* Ticket button opens ticket image
* Status is visually clear

---

### TRIP-041 — Add delete trip step UI

**Description**

Allow users to delete an itinerary step from the UI.

**Scope**

* Add delete button to step card
* Add confirmation dialog
* Call delete API
* Refresh itinerary after delete

**Acceptance Criteria**

* User can delete step
* Deleted step disappears from UI
* Cancel does not delete step

---

### TRIP-042 — Add drag-and-drop step reorder

**Description**

Allow users to reorder trip steps with drag-and-drop.

**Scope**

* Install and configure drag-and-drop library
* Enable dragging step cards
* Save order using reorder API
* Keep order after page refresh

**Acceptance Criteria**

* User can drag steps to reorder
* New order is saved
* Order remains correct after refresh
* UI handles API errors gracefully

---

## Epic 9: Focus Mode

---

### TRIP-043 — Build focus mode page

**Description**

Create a dedicated focus mode page for active trips.

**Route**

```text
/trips/:tripId/focus
```

**Scope**

* Load trip detail
* Show trip title
* Show trip progress
* Show current step
* Show next steps
* Hide unnecessary dashboard controls

**Acceptance Criteria**

* Focus mode displays active trip clearly
* Current Todo step is highlighted
* Completed steps are separated or collapsed
* Page is mobile-friendly

---

### TRIP-044 — Implement current step logic

**Description**

Determine which step should be shown as the current step.

**Logic**

The current step should be the first step with status `Todo`, ordered by `orderIndex`.

**Scope**

* Find first Todo step
* Show it as current step
* Show Done and Skipped steps separately
* Handle case where all steps are done

**Acceptance Criteria**

* First Todo step is shown as current
* Done steps are not selected as current
* Skipped steps are not selected as current
* Completed trip message is shown when all steps are done or skipped

---

### TRIP-045 — Add focus mode step actions

**Description**

Add action buttons to the focus mode current step.

**Scope**

* Open Google Maps
* View ticket image
* Open external URL
* Mark as Done
* Skip step

**Acceptance Criteria**

* Map button opens Google Maps in new tab
* Ticket button opens ticket image
* External URL opens in new tab
* Done button updates step status
* Skip button updates step status
* Current step moves to next Todo step after action

---

### TRIP-046 — Connect start trip flow to focus mode

**Description**

When the user starts a trip, redirect them to focus mode.

**Scope**

* Call start trip API
* Update trip status to Active
* Redirect to `/trips/:tripId/focus`
* Add continue active trip button on dashboard

**Acceptance Criteria**

* Clicking Start Trip activates the trip
* User is redirected to focus mode
* Dashboard shows active trip
* Continue Active Trip opens focus mode

---

## Epic 10: Sharing, Future Version

---

### TRIP-047 — Add public share token to Trip

**Description**

Prepare trip sharing by adding a public share token field to Trip.

**Scope**

* Add `publicShareToken`
* Add `isPublicShared`
* Update database migration

**Acceptance Criteria**

* Trip can store share token
* Sharing can be enabled or disabled
* Existing trips still work after migration

---

### TRIP-048 — Implement create share link API

**Description**

Allow users to generate a public read-only trip link.

**API**

```http
POST /api/trips/{tripId}/share
```

**Scope**

* Validate trip ownership
* Generate public token
* Save token to trip
* Return public share URL

**Acceptance Criteria**

* User can generate share link for own trip
* User cannot generate share link for another user's trip
* API returns public URL

---

### TRIP-049 — Implement public trip view API

**Description**

Allow anyone with a share token to view a trip.

**API**

```http
GET /api/public/trips/{token}
```

**Scope**

* Find trip by public token
* Return trip detail and ordered steps
* Do not require authentication
* Do not expose private user data

**Acceptance Criteria**

* Public trip can be viewed without login
* Invalid token returns not found
* Public response does not expose sensitive data

---

### TRIP-050 — Build public shared trip page

**Description**

Create a public read-only page for shared trips.

**Route**

```text
/share/:token
```

**Scope**

* Load trip by token
* Show trip info
* Show ordered itinerary
* Show map and ticket buttons
* Hide edit/delete buttons

**Acceptance Criteria**

* Shared trip page works without login
* Visitors can view itinerary
* Visitors cannot edit trip
* Invalid share link shows not found message

---

## Epic 11: Polish and Quality

---

### TRIP-051 — Add global error handling

**Description**

Add consistent error handling for frontend and backend.

**Scope**

* Backend exception middleware
* Standard API error response
* Frontend API error handler
* User-friendly error messages

**Acceptance Criteria**

* Unexpected backend errors return clean response
* Frontend shows readable errors
* Sensitive error details are not exposed

---

### TRIP-052 — Add loading and empty states

**Description**

Improve user experience by adding loading and empty states.

**Scope**

* Dashboard loading state
* Trip detail loading state
* Focus mode loading state
* Empty trip list state
* Empty itinerary state

**Acceptance Criteria**

* User sees loading state during API calls
* Empty states are clear and helpful
* UI does not look broken while data loads

---

### TRIP-053 — Make UI mobile responsive

**Description**

Optimize the application for mobile devices.

**Scope**

* Dashboard mobile layout
* Trip detail mobile layout
* Step card mobile layout
* Focus mode mobile layout
* Image preview responsiveness

**Acceptance Criteria**

* App is usable on mobile
* Focus mode works well on phone
* Buttons are easy to tap
* No major layout overflow

---

### TRIP-054 — Add basic validation rules

**Description**

Add frontend and backend validation for important fields.

**Scope**

* Required title
* Required destination for trip
* Required step title
* Valid URL for Google Maps URL
* Valid URL for external URL
* Valid date range
* File type validation
* File size validation

**Acceptance Criteria**

* Invalid form data is blocked
* Clear validation messages are shown
* Backend also validates important rules

---

### TRIP-055 — Add README documentation

**Description**

Update project documentation.

**Scope**

* Project overview
* Tech stack
* Local setup
* Environment variables
* Database migration commands
* Frontend run commands
* Backend run commands
* API overview

**Acceptance Criteria**

* New developer can run project using README
* Environment variables are documented
* Main APIs are listed

---

# Suggested Sprint Plan

## Sprint 1 — Foundation and Auth

* TRIP-001
* TRIP-002
* TRIP-003
* TRIP-004
* TRIP-005
* TRIP-006
* TRIP-007
* TRIP-008
* TRIP-009

## Sprint 2 — Trip Backend and Basic Frontend

* TRIP-010
* TRIP-011
* TRIP-012
* TRIP-013
* TRIP-014
* TRIP-015
* TRIP-029
* TRIP-030
* TRIP-031
* TRIP-032
* TRIP-033

## Sprint 3 — Trip Steps and Itinerary Builder

* TRIP-018
* TRIP-019
* TRIP-020
* TRIP-021
* TRIP-022
* TRIP-023
* TRIP-034
* TRIP-035
* TRIP-036
* TRIP-038
* TRIP-039
* TRIP-040
* TRIP-041

## Sprint 4 — Uploads and Focus Mode

* TRIP-016
* TRIP-017
* TRIP-024
* TRIP-025
* TRIP-026
* TRIP-027
* TRIP-028
* TRIP-043
* TRIP-044
* TRIP-045
* TRIP-046

## Sprint 5 — Sharing and Polish

* TRIP-042
* TRIP-047
* TRIP-048
* TRIP-049
* TRIP-050
* TRIP-051
* TRIP-052
* TRIP-053
* TRIP-054
* TRIP-055
