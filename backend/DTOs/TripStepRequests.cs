using backend.Entities;

namespace backend.DTOs;

public record CreateTripStepRequest(
    string Title,
    string? Description,
    TripStepType Type,
    DateTimeOffset? ScheduledAt,
    decimal? CostAmount,
    string? GoogleMapsUrl,
    string? ExternalUrl,
    IReadOnlyList<string>? ImageUrls,
    IReadOnlyList<Guid>? ParticipantMemberIds);

public record UpdateTripStepRequest(
    string Title,
    string? Description,
    TripStepType Type,
    DateTimeOffset? ScheduledAt,
    decimal? CostAmount,
    string? GoogleMapsUrl,
    string? ExternalUrl,
    IReadOnlyList<string>? ImageUrls,
    IReadOnlyList<Guid>? ParticipantMemberIds);

public record ReorderTripStepsRequest(
    IReadOnlyList<Guid> StepIds);
