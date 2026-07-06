using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public record CreateTripRequest(
    [Required, MaxLength(150)] string Title,
    [Required, MaxLength(150)] string Destination,
    [MaxLength(2000)] string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    [MaxLength(2048)] string? CoverImageUrl,
    [Required, MinLength(3), MaxLength(3)] string CurrencyCode);

public record UpdateTripRequest(
    [Required, MaxLength(150)] string Title,
    [Required, MaxLength(150)] string Destination,
    [MaxLength(2000)] string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    [MaxLength(2048)] string? CoverImageUrl,
    [Required, MinLength(3), MaxLength(3)] string CurrencyCode);
