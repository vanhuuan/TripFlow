using System.Net.Http.Json;
using System.Text.Json.Serialization;
using backend.Configuration;
using backend.DTOs;
using Microsoft.Extensions.Options;

namespace backend.Services;

public interface IGooglePlacesService
{
    Task<IReadOnlyList<PlaceSuggestionResponse>> AutocompleteAsync(string input, string languageCode, CancellationToken cancellationToken);
}

public sealed class GooglePlacesService(
    HttpClient httpClient,
    IOptions<GoogleMapsSettings> settings,
    ILogger<GooglePlacesService> logger) : IGooglePlacesService
{
    private const string FieldMask = "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text";

    public async Task<IReadOnlyList<PlaceSuggestionResponse>> AutocompleteAsync(string input, string languageCode, CancellationToken cancellationToken)
    {
        var apiKey = settings.Value.ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new GooglePlacesException("Google Places is not configured.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "v1/places:autocomplete")
        {
            Content = JsonContent.Create(new AutocompleteRequest(input, languageCode, false))
        };
        request.Headers.Add("X-Goog-Api-Key", apiKey);
        request.Headers.Add("X-Goog-FieldMask", FieldMask);

        HttpResponseMessage response;
        try
        {
            response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new GooglePlacesException("Google Places timed out.");
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "Google Places autocomplete request failed.");
            throw new GooglePlacesException("Google Places is temporarily unavailable.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Google Places autocomplete returned status {StatusCode}.", (int)response.StatusCode);
                throw new GooglePlacesException("Google Places is temporarily unavailable.");
            }

            var result = await response.Content.ReadFromJsonAsync<AutocompleteResponse>(cancellationToken: cancellationToken);
            return result?.Suggestions?
                .Select(suggestion => suggestion.PlacePrediction)
                .Where(prediction => prediction is not null && !string.IsNullOrWhiteSpace(prediction.PlaceId))
                .Select(prediction => ToSuggestion(prediction!))
                .Take(5)
                .ToList() ?? [];
        }
    }

    private static PlaceSuggestionResponse ToSuggestion(PlacePrediction prediction)
    {
        var fullText = prediction.Text?.Text?.Trim();
        var name = prediction.StructuredFormat?.MainText?.Text?.Trim();
        if (string.IsNullOrWhiteSpace(name)) name = fullText ?? "Place";

        var address = prediction.StructuredFormat?.SecondaryText?.Text?.Trim();
        var query = string.IsNullOrWhiteSpace(fullText) ? name : fullText;
        var mapsUrl = $"https://www.google.com/maps/search/?api=1&query={Uri.EscapeDataString(query)}&query_place_id={Uri.EscapeDataString(prediction.PlaceId)}";
        return new PlaceSuggestionResponse(prediction.PlaceId, name, string.IsNullOrWhiteSpace(address) ? null : address, mapsUrl);
    }

    private sealed record AutocompleteRequest(
        [property: JsonPropertyName("input")] string Input,
        [property: JsonPropertyName("languageCode")] string LanguageCode,
        [property: JsonPropertyName("includeQueryPredictions")] bool IncludeQueryPredictions);

    private sealed record AutocompleteResponse(
        [property: JsonPropertyName("suggestions")] IReadOnlyList<Suggestion>? Suggestions);

    private sealed record Suggestion(
        [property: JsonPropertyName("placePrediction")] PlacePrediction? PlacePrediction);

    private sealed record PlacePrediction(
        [property: JsonPropertyName("placeId")] string PlaceId,
        [property: JsonPropertyName("text")] PlaceText? Text,
        [property: JsonPropertyName("structuredFormat")] StructuredFormat? StructuredFormat);

    private sealed record StructuredFormat(
        [property: JsonPropertyName("mainText")] PlaceText? MainText,
        [property: JsonPropertyName("secondaryText")] PlaceText? SecondaryText);

    private sealed record PlaceText([property: JsonPropertyName("text")] string? Text);
}

public sealed class GooglePlacesException(string message) : Exception(message);
