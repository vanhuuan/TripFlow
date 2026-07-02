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

### TRIP-003 — Set up backend with .NET 10 Web API

**Description**

Initialize the backend API using .NET 10 Web API.

**Scope**

* Create .NET 10 Web API project
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
