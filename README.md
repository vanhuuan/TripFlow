# Trip Flow - Trip Planner Website — AI Agent Execution Plan

## 1. Product Idea

Build a web app where users can create trip plans, add places, transport tickets, notes, Google Maps links, images, and then start the trip in a focused step-by-step screen.

Main flow:

```text
Login
→ Dashboard
→ Create Trip
→ Add itinerary steps
→ Add place / ticket / note / Google Maps link / image
→ Start Trip
→ Focus Mode
→ Click step
→ Open Google Maps / show ticket / show detail
```

---

## 2. Recommended Stack

Since this project fits well with React and .NET, use:

```text
Frontend:
React + Vite + TypeScript + Tailwind CSS

Backend:
.NET 8 Web API

Database:
PostgreSQL or SQL Server

Auth:
JWT login/signup first
Later: Google login

File storage:
Local file upload first
Later: Azure Blob Storage / S3

Map:
Store Google Maps links first
Later: Google Maps API integration
```

Keep it simple first. Do not start with full Google Maps API. Just store links in MVP.

---

## 3. Core Features

### 3.1 Auth

User can:

```text
Sign up
Log in
Log out
View only their own trips
```

### 3.2 Trip Management

User can:

```text
Create trip
Edit trip
Delete trip
View trip list
View trip detail
```

Trip fields:

```text
Trip name
Destination
Start date
End date
Description
Cover image
Status: Draft / Active / Completed
```

### 3.3 Trip Steps

A trip has many steps.

A step can be:

```text
Place
Transport ticket
Hotel
Restaurant
Activity
Note
```

Each step has:

```text
Title
Description
Date/time
Order number
Google Map link
Ticket image
Place image
Type
Status: Todo / Done / Skipped
```

### 3.4 Focus Trip Mode

When the user clicks **Start Trip**:

```text
Trip status becomes Active
App opens Focus Screen
Only shows current trip
Steps are displayed in order
Clicking a step opens its action
```

Example:

```text
Place step → Open Google Maps link
Ticket step → Show ticket image
Hotel step → Show booking/ticket image or map
Note step → Show note detail
```

---

## 4. Future Features

After MVP:

```text
Share trip with friends
Add collaborators
Public read-only trip link
Upload many images to places
Comments on trip steps
Expense tracking
Offline mode
Mobile PWA
Google Maps API preview
Trip timeline view
Calendar view
AI auto-plan trip
```

---

## 5. Data Model

### 5.1 User

```ts
User {
  id: string
  email: string
  passwordHash: string
  displayName: string
  createdAt: Date
}
```

### 5.2 Trip

```ts
Trip {
  id: string
  userId: string
  title: string
  destination: string
  description?: string
  startDate?: Date
  endDate?: Date
  coverImageUrl?: string
  status: "Draft" | "Active" | "Completed"
  createdAt: Date
  updatedAt: Date
}
```

### 5.3 TripStep

```ts
TripStep {
  id: string
  tripId: string
  type: "Place" | "Transport" | "Hotel" | "Restaurant" | "Activity" | "Note"
  title: string
  description?: string
  scheduledAt?: Date
  orderIndex: number
  googleMapUrl?: string
  ticketImageUrl?: string
  placeImageUrl?: string
  externalUrl?: string
  status: "Todo" | "Done" | "Skipped"
  createdAt: Date
  updatedAt: Date
}
```

### 5.4 TripShare — Future

```ts
TripShare {
  id: string
  tripId: string
  sharedWithEmail?: string
  publicToken?: string
  permission: "View" | "Edit"
  createdAt: Date
}
```

---

## 6. API Design

### 6.1 Auth APIs

```http
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### 6.2 Trip APIs

```http
GET    /api/trips
GET    /api/trips/{tripId}
POST   /api/trips
PUT    /api/trips/{tripId}
DELETE /api/trips/{tripId}
POST   /api/trips/{tripId}/start
POST   /api/trips/{tripId}/complete
```

### 6.3 Trip Step APIs

```http
GET    /api/trips/{tripId}/steps
POST   /api/trips/{tripId}/steps
PUT    /api/trips/{tripId}/steps/{stepId}
DELETE /api/trips/{tripId}/steps/{stepId}
POST   /api/trips/{tripId}/steps/reorder
POST   /api/trips/{tripId}/steps/{stepId}/done
POST   /api/trips/{tripId}/steps/{stepId}/skip
```

### 6.4 File Upload APIs

```http
POST /api/files/upload
```

Use this for:

```text
Ticket image
Place image
Trip cover image
```

---

## 7. Frontend Pages

### 7.1 Public Pages

```text
/login
/signup
```

### 7.2 Authenticated Pages

```text
/dashboard
/trips/new
/trips/:tripId
/trips/:tripId/edit
/trips/:tripId/focus
```

---

## 8. Main UI Screens

### 8.1 Dashboard

Shows all trips:

```text
Upcoming trips
Active trip
Completed trips
Create new trip button
```

Trip card:

```text
Cover image
Title
Destination
Date range
Status
Open button
```

### 8.2 Trip Detail Page

Shows trip info and itinerary steps.

Main actions:

```text
Edit trip
Add step
Start trip
Delete trip
```

Step card:

```text
Step type icon
Title
Time
Description
Google Maps button
Ticket button
Done button
```

### 8.3 Add/Edit Step Modal

Fields:

```text
Step type
Title
Description
Date/time
Google Maps link
External link
Ticket image upload
Place image upload
```

### 8.4 Focus Mode Screen

This is the trip execution mode.

Layout:

```text
Trip title
Current date
Progress: 3/10 steps done

Current step
Next steps
Done / Skip buttons
Open Google Maps
Show ticket
```

This screen should be clean, with no noisy dashboard elements.

---

## 9. AI Agent Task Split

You can give these tasks one by one to an AI coding agent.

---

### Agent Task 1: Create Project Structure

```text
Create a full-stack trip planner project.

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios

Backend:
- .NET 8 Web API
- Entity Framework Core
- JWT Authentication
- PostgreSQL or SQL Server

Create folders:
- frontend
- backend
- docs

Add README with setup instructions.
```

Expected output:

```text
Project runs locally
Frontend starts with npm run dev
Backend starts with dotnet run
```

---

### Agent Task 2: Backend Domain Models

```text
Implement backend domain models for:

- User
- Trip
- TripStep

Trip should belong to User.
Trip should have many TripSteps.
TripStep should belong to Trip.

Add enum:
- TripStatus: Draft, Active, Completed
- TripStepType: Place, Transport, Hotel, Restaurant, Activity, Note
- TripStepStatus: Todo, Done, Skipped

Use EF Core configuration.
Create initial migration.
```

Expected output:

```text
Database tables created
Relationships are correct
```

---

### Agent Task 3: Auth Backend

```text
Implement authentication APIs:

POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me

Requirements:
- Hash password securely
- Return JWT token after login
- Protect authenticated APIs with JWT
- Store user email and display name
- Validate duplicate email
```

Expected output:

```text
User can sign up
User can log in
JWT works
Protected APIs reject anonymous users
```

---

### Agent Task 4: Trip CRUD Backend

```text
Implement Trip APIs:

GET /api/trips
GET /api/trips/{tripId}
POST /api/trips
PUT /api/trips/{tripId}
DELETE /api/trips/{tripId}
POST /api/trips/{tripId}/start
POST /api/trips/{tripId}/complete

Rules:
- User can only access their own trips
- Start trip changes status to Active
- Complete trip changes status to Completed
- Return trip with ordered steps
```

Expected output:

```text
Trip CRUD works
User data is isolated
```

---

### Agent Task 5: Trip Step CRUD Backend

```text
Implement TripStep APIs:

GET /api/trips/{tripId}/steps
POST /api/trips/{tripId}/steps
PUT /api/trips/{tripId}/steps/{stepId}
DELETE /api/trips/{tripId}/steps/{stepId}
POST /api/trips/{tripId}/steps/reorder
POST /api/trips/{tripId}/steps/{stepId}/done
POST /api/trips/{tripId}/steps/{stepId}/skip

Rules:
- Steps are ordered by orderIndex
- New step should be added to the end by default
- Reorder endpoint accepts list of step IDs
- User can only update steps in their own trips
```

Expected output:

```text
Can add places, tickets, hotels, restaurants, activities, and notes
Can reorder steps
Can mark step done/skipped
```

---

### Agent Task 6: File Upload Backend

```text
Implement file upload API:

POST /api/files/upload

Requirements:
- Accept image files only
- Support jpg, jpeg, png, webp
- Reject invalid file types
- Limit file size to 5MB
- Save files locally first under /uploads
- Return public file URL
```

Expected output:

```text
Can upload ticket images
Can upload place images
Can upload trip cover images
```

Later this can be replaced with Azure Blob Storage.

---

### Agent Task 7: Frontend Setup

```text
Create frontend structure:

src/
- api/
- components/
- pages/
- layouts/
- hooks/
- types/
- utils/

Install:
- react-router-dom
- axios
- tailwindcss
- lucide-react
- react-hook-form
- zod

Create app routes:

/login
/signup
/dashboard
/trips/new
/trips/:tripId
/trips/:tripId/focus
```

Expected output:

```text
Frontend routing works
Base layout works
Tailwind works
```

---

### Agent Task 8: Frontend Auth

```text
Implement frontend auth flow:

- Login page
- Signup page
- Store JWT token
- Axios auth interceptor
- Protected routes
- Logout button
- useAuth hook
```

Expected output:

```text
User can sign up
User can log in
User stays logged in after refresh
Protected pages redirect to login
```

---

### Agent Task 9: Dashboard UI

```text
Build dashboard page.

Requirements:
- Fetch user's trips from API
- Show trip cards
- Show trip status
- Add "Create Trip" button
- Add "Continue Active Trip" section if user has active trip
```

Expected output:

```text
User can see all trips
User can open a trip
User can create a new trip
```

---

### Agent Task 10: Create/Edit Trip UI

```text
Build create and edit trip forms.

Fields:
- Title
- Destination
- Description
- Start date
- End date
- Cover image upload

Use react-hook-form and zod validation.
```

Expected output:

```text
User can create trip
User can edit trip
Cover image can be uploaded
```

---

### Agent Task 11: Trip Detail UI

```text
Build trip detail page.

Requirements:
- Show trip information
- Show ordered itinerary steps
- Add step button
- Edit/delete step
- Start trip button
- Complete trip button

Each step card should show:
- Type
- Title
- Time
- Description
- Map button if googleMapUrl exists
- Ticket button if ticketImageUrl exists
- Image preview if placeImageUrl exists
```

Expected output:

```text
User can manage full itinerary
```

---

### Agent Task 12: Add/Edit Step UI

```text
Build add/edit step modal or page.

Fields:
- Step type
- Title
- Description
- Scheduled date/time
- Google Map URL
- External URL
- Ticket image
- Place image

Validation:
- Title is required
- Google Map URL must be valid URL if provided
- Image upload should show preview
```

Expected output:

```text
User can add places
User can add transport tickets
User can add hotels
User can add restaurants
```

---

### Agent Task 13: Reorder Trip Steps

```text
Add drag-and-drop reorder for trip steps.

Use a library like dnd-kit.

Requirements:
- Drag step cards
- Save new order to backend
- Keep order after refresh
```

Expected output:

```text
User can arrange itinerary order easily
```

---

### Agent Task 14: Focus Mode

```text
Build trip focus screen at:

/trips/:tripId/focus

Requirements:
- Show only active trip
- Display steps in order
- Highlight current first Todo step
- Show progress count
- Button: Open Google Maps
- Button: View Ticket
- Button: Open External Link
- Button: Mark Done
- Button: Skip
- Show completed steps collapsed
```

Expected output:

```text
When user starts a trip, they can follow the plan step by step
```

This is the core “wow” feature.

---

### Agent Task 15: Share Trip — Future

```text
Implement read-only public sharing.

Backend:
- Add publicShareToken to Trip
- POST /api/trips/{tripId}/share
- GET /api/public/trips/{token}

Frontend:
- Share button
- Copy public link
- Public trip view page

Rules:
- Public users can only view
- No editing without login
```

Expected output:

```text
User can share trip with friends using a link
```

---

## 10. Suggested Development Milestones

### Milestone 1: Basic App

```text
Project setup
Auth
Dashboard
Trip CRUD
```

### Milestone 2: Itinerary Builder

```text
Trip step CRUD
Google Maps link
Ticket image upload
Place image upload
Step ordering
```

### Milestone 3: Focus Mode

```text
Start trip
Active trip screen
Current step
Done/skip step
Open map/ticket actions
```

### Milestone 4: Sharing

```text
Public read-only link
Friend sharing
Collaborator permissions
```

### Milestone 5: Polish

```text
Mobile responsive UI
Better image gallery
Calendar view
PWA support
Offline trip cache
```

---

## 11. Recommended MVP Order

Build in this exact order:

```text
1. Backend project setup
2. Database models
3. Auth
4. Trip CRUD
5. Trip step CRUD
6. Frontend setup
7. Login/signup UI
8. Dashboard
9. Trip detail page
10. Add/edit step
11. Image upload
12. Focus mode
13. Reorder steps
14. Share trip
```

Avoid these early:

```text
Do not build sharing first.
Do not build Google Maps API first.
Do not overthink images first.
```

The MVP should prove this:

```text
I can create a trip.
I can add places and tickets.
I can start the trip.
I can click each step and know where to go.
```

That is the core. Everything else is an upgrade later.

---

## 12. First Prompt for AI Coding Agent

Use this as your first prompt:

```text
Create a full-stack Trip Planner web application.

Tech stack:
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: .NET 8 Web API
- Database: PostgreSQL or SQL Server
- Auth: JWT authentication

Main features:
- User signup/login
- User can create, edit, delete trip plans
- A trip has many itinerary steps
- A step can be Place, Transport, Hotel, Restaurant, Activity, or Note
- A step can store Google Maps URL, ticket image URL, place image URL, external URL, title, description, scheduled time, order index, and status
- User can start a trip
- Started trip opens a focus mode screen where the user can follow each step, open Google Maps links, view ticket images, and mark steps as done or skipped

Create:
- Backend solution structure
- Frontend project structure
- Database models
- API route plan
- Initial README
- Clean folder structure

Do not implement all features at once. First create the project foundation and explain the next commands to run.
```

---

## 13. App Name Ideas

```text
TripFlow
GoPlan
TripBoard
RouteMate
TripFocus
TravelStack
PlanPilot
```

Recommended names:

```text
TripFlow
PlanPilot
```

