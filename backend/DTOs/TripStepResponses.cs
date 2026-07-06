using backend.Entities;

namespace backend.DTOs;

public record TripStepResponse(
    Guid Id,
    Guid TripId,
    string Title,
    string? Description,
    TripStepType Type,
    TripStepStatus Status,
    DateTimeOffset? ScheduledAt,
    decimal? CostAmount,
    string? GoogleMapsUrl,
    string? ExternalUrl,
    IReadOnlyList<string> ImageUrls,
    int OrderIndex,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
