# TripFlow

TripFlow is a full-stack trip planner foundation. Epic 1 sets up the runnable project shell for a React frontend, .NET Web API backend, PostgreSQL configuration, and EF Core migrations.

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: .NET 10 Web API
- Database: PostgreSQL with Entity Framework Core
- Local API docs: Swagger UI and OpenAPI

## Project Structure

```text
frontend/   React + Vite application
backend/    .NET 10 Web API
docs/       Project documentation
plan/       Epic and Jira planning notes
```

## Prerequisites

- Node.js 25 or compatible current Node runtime
- npm 11 or compatible current npm runtime
- .NET SDK 10
- PostgreSQL running locally

If Git reports dubious ownership for this workspace, run:

```powershell
git config --global --add safe.directory E:/Learning/TripFlow
```

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

The Vite app runs at `http://localhost:5173` by default.

Frontend environment variable:

```text
VITE_API_BASE_URL=http://localhost:5000
```

Copy `frontend/.env.example` to `frontend/.env` when local overrides are needed.

## Backend Setup

```powershell
cd backend
dotnet restore
dotnet run
```

The API exposes:

- `GET /health`
- Swagger UI at `/swagger` in development
- OpenAPI JSON at `/openapi/v1.json` in development

Backend environment variables:

```text
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=tripflow_dev;Username=postgres;Password=postgres
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000
```

Copy `backend/.env.example` as a reference for local configuration. .NET reads environment variables from the shell; it does not load `.env` files automatically.

## Database Setup

Update the PostgreSQL connection string in `backend/appsettings.Development.json` or set `ConnectionStrings__DefaultConnection` in your shell.

Create and apply the initial migration after domain entities are introduced:

```powershell
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Epic 1 intentionally creates an empty `AppDbContext`; later epics will add `User`, `Trip`, and `TripStep` entities before the first meaningful migration.
