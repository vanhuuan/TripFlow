using System.ComponentModel.DataAnnotations;
using backend.Entities;

namespace backend.DTOs;

public record CreateTripStepRequest(
    [Required, MaxLength(150)] string Title,
    [MaxLength(2000)] string? Description,
    TripStepType Type,
    DateTimeOffset? ScheduledAt,
    [MaxLength(2048)] string? GoogleMapsUrl,
    [MaxLength(2048)] string? ExternalUrl,
    [MaxLength(2048)] string? TicketImageUrl,
    [MaxLength(2048)] string? PlaceImageUrl);

public record UpdateTripStepRequest(
    [Required, MaxLength(150)] string Title,
    [MaxLength(2000)] string? Description,
    TripStepType Type,
    DateTimeOffset? ScheduledAt,
    [MaxLength(2048)] string? GoogleMapsUrl,
    [MaxLength(2048)] string? ExternalUrl,
    [MaxLength(2048)] string? TicketImageUrl,
    [MaxLength(2048)] string? PlaceImageUrl);

public record ReorderTripStepsRequest(
    [Required, MinLength(1)] IReadOnlyList<Guid> StepIds);
