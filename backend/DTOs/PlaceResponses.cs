namespace backend.DTOs;

public sealed record PlaceSuggestionResponse(
    string PlaceId,
    string Name,
    string? Address,
    string GoogleMapsUrl);
