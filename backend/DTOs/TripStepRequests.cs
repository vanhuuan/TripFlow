using System.ComponentModel.DataAnnotations;
using backend.Entities;

namespace backend.DTOs;

public record CreateTripStepRequest(
    [property: Required, MaxLength(150)] string Title,
    [property: MaxLength(2000)] string? Description,
    TripStepType Type,
    DateTimeOffset? ScheduledAt,
    [property: MaxLength(2048)] string? GoogleMapsUrl,
    [property: MaxLength(2048)] string? ExternalUrl,
    [property: MaxLength(2048)] string? TicketImageUrl,
    [property: MaxLength(2048)] string? PlaceImageUrl);

public record UpdateTripStepRequest(
    [property: Required, MaxLength(150)] string Title,
    [property: MaxLength(2000)] string? Description,
    TripStepType Type,
    DateTimeOffset? ScheduledAt,
    [property: MaxLength(2048)] string? GoogleMapsUrl,
    [property: MaxLength(2048)] string? ExternalUrl,
    [property: MaxLength(2048)] string? TicketImageUrl,
    [property: MaxLength(2048)] string? PlaceImageUrl);

public record ReorderTripStepsRequest(
    [property: Required, MinLength(1)] IReadOnlyList<Guid> StepIds);
