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
    string CurrencyCode,
    decimal TotalCost,
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
    string CurrencyCode,
    decimal TotalCost,
    TripStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    bool IsPublicShared,
    string? PublicShareToken,
    IReadOnlyList<TripMemberResponse> Members,
    IReadOnlyList<TripStepResponse> Steps);

public record PublicTripDetailResponse(
    Guid Id,
    string Title,
    string Destination,
    string? Description,
    string? CoverImageUrl,
    string CurrencyCode,
    IReadOnlyList<PublicTripStepResponse> Steps);

public record PublicTripStepResponse(
    Guid Id,
    string Title,
    string? Description,
    TripStepType Type,
    TripStepStatus Status,
    string? ScheduledTime,
    string? GoogleMapsUrl,
    string? ExternalUrl,
    IReadOnlyList<string> ImageUrls,
    int OrderIndex);
