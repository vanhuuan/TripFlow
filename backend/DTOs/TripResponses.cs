using backend.Entities;

namespace backend.DTOs;

public record TripSummaryResponse(
    Guid Id,
    string Title,
    string Destination,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? CoverImageUrl,
    TripStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record TripDetailResponse(
    Guid Id,
    string Title,
    string Destination,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? CoverImageUrl,
    TripStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<TripStepResponse> Steps);
