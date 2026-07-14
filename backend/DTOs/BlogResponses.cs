namespace backend.DTOs;

public record TripBlogContentResponse(
    string Title,
    string Introduction,
    string Conclusion,
    string Destination,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? CoverImageUrl,
    string CurrencyCode,
    decimal TotalCost,
    IReadOnlyList<TripBlogSectionResponse> Sections);

public record TripBlogSectionResponse(
    Guid SourceStepId,
    string Heading,
    string Body,
    decimal? CostAmount,
    DateTimeOffset? ScheduledAt,
    IReadOnlyList<string> ImageUrls);

public record TripBlogResponse(
    Guid Id,
    Guid TripId,
    string Locale,
    TripBlogContentResponse Draft,
    DateTimeOffset GeneratedAt,
    DateTimeOffset UpdatedAt,
    bool IsPublished,
    DateTimeOffset? PublishedAt,
    string? PublicUrl,
    string? GeneratedProvider,
    string? GeneratedModel);


public record PublicTripBlogResponse(
    Guid Id,
    string Locale,
    TripBlogContentResponse Content,
    DateTimeOffset PublishedAt);
