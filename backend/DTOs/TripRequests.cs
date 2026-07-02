using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public record CreateTripRequest(
    [property: Required, MaxLength(150)] string Title,
    [property: Required, MaxLength(150)] string Destination,
    [property: MaxLength(2000)] string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    [property: MaxLength(2048)] string? CoverImageUrl);

public record UpdateTripRequest(
    [property: Required, MaxLength(150)] string Title,
    [property: Required, MaxLength(150)] string Destination,
    [property: MaxLength(2000)] string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    [property: MaxLength(2048)] string? CoverImageUrl);
