using backend.Entities;

namespace backend.DTOs;

public record TripMemberResponse(
    Guid Id,
    string Name);

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
    IReadOnlyList<Guid> ParticipantMemberIds,
    int OrderIndex,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
