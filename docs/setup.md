# Epic 1 Local Setup

## Commands

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Backend:

```powershell
cd backend
dotnet restore
dotnet run
```

Database migrations:

```powershell
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Environment

Frontend uses `VITE_API_BASE_URL`.

Backend uses `ConnectionStrings__DefaultConnection` for PostgreSQL.

Default local connection string:

```text
Host=localhost;Port=5432;Database=tripflow_dev;Username=postgres;Password=postgres
```

## Health Check

```http
GET /health
```

Expected response:

```json
{
  "status": "ok",
  "service": "TripFlow API"
}
```
