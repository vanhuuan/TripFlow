using backend.Entities;

namespace backend.DTOs;

public record CreateTripStepRequest(
    string Title,
    string? Description,
    TripStepType Type,
    DateTimeOffset? ScheduledAt,
    string? GoogleMapsUrl,
    string? ExternalUrl,
    IReadOnlyList<string>? ImageUrls);

public record UpdateTripStepRequest(
    string Title,
    string? Description,
    TripStepType Type,
    DateTimeOffset? ScheduledAt,
    string? GoogleMapsUrl,
    string? ExternalUrl,
    IReadOnlyList<string>? ImageUrls);

public record ReorderTripStepsRequest(
    IReadOnlyList<Guid> StepIds);
