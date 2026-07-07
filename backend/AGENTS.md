# Backend Agent Guide

## Scope
This guide applies to everything under `backend/`.

## Stack
- .NET 10 Web API
- Entity Framework Core
- PostgreSQL
- Swagger/OpenAPI in development

## Entry Points
- Application startup: `Program.cs`
- API controllers: `Controllers/`
- Data access and EF Core: `Data/`
- DTOs: `DTOs/`
- Domain entities: `Entities/`
- Services: `Services/`
- Configuration: `appsettings*.json` and `Configuration/`

## Working Rules
- Prefer async end-to-end for database and I/O operations.
- Keep controller actions thin; move business logic into services when practical.
- Keep DTOs separate from entities.
- Use EF Core migrations for schema changes.
- Do not hardcode secrets or machine-specific settings.
- Match the existing API and validation style before adding new patterns.

## Configuration
- Local settings belong in environment variables or `appsettings.Development.json`.
- Reference `.env.example` for local setup, but remember .NET does not load `.env` files automatically.
- Keep connection strings and storage credentials out of source control.

## Verification
- Run `dotnet build`
- If you change database behavior, run the relevant EF migration commands and validate the schema path
- If you change an endpoint, verify the request/response shape against the existing API contract

## Notes
- Preserve the current folder organization when adding new code.
- Keep Swagger/OpenAPI behavior intact unless the task explicitly changes it.
