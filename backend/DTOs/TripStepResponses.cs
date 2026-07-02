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
    string? GoogleMapsUrl,
    string? ExternalUrl,
    string? TicketImageUrl,
    string? PlaceImageUrl,
    int OrderIndex,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
