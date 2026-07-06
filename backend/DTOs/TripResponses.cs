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
    DateTimeOffset UpdatedAt,
    bool IsPublicShared);

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
    bool IsPublicShared,
    string? PublicShareToken,
    IReadOnlyList<TripStepResponse> Steps);

public record PublicTripDetailResponse(
    Guid Id,
    string Title,
    string Destination,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? CoverImageUrl,
    IReadOnlyList<TripStepResponse> Steps);
