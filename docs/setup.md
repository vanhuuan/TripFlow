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

AI blog generation uses one server-selected model. Set `AI__Provider` to `OpenAI`, `Anthropic`, or `Google`; set `AI__Model` to the provider model ID; and configure the matching API key (`OpenAI__ApiKey`, `Anthropic__ApiKey`, or `GoogleAI__ApiKey`). The API fails at startup when this configuration is missing or invalid.

Blog drafts and published snapshots are stored as UTF-8 Markdown in the private Azure Blob container configured by `BlogBlobStorage__ContainerName` (default `tripflow-blogs`). It reuses `BlobStorage__ConnectionString`. Applying migration `20260713090000_MoveBlogContentToBlobStorage` deletes existing database-stored blog drafts and published content.

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
