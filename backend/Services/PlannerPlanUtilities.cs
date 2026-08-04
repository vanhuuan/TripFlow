using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend.DTOs;
using backend.Entities;

namespace backend.Services;

public static class PlannerPlanUtilities
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public static ProposedTripPlanResponse FromTrip(Trip trip) => new(
        trip.Title,
        trip.Destination,
        trip.Description,
        trip.StartDate,
        trip.EndDate,
        trip.CurrencyCode,
        trip.Steps.OrderBy(step => step.OrderIndex).Select(step => new ProposedTripStepResponse(
            step.Id.ToString("N"),
            step.Id,
            step.Title,
            step.Description,
            step.Type,
            step.Status,
            step.ScheduledAt,
            step.CostAmount,
            step.GoogleMapsUrl,
            step.ExternalUrl,
            DeserializeImageUrls(step.ImageUrlsJson),
            step.Participants.Select(participant => participant.TripMemberId).Order().ToList())).ToList());

    public static string Serialize(ProposedTripPlanResponse plan) => JsonSerializer.Serialize(plan, JsonOptions);

    public static ProposedTripPlanResponse Deserialize(string json) =>
        JsonSerializer.Deserialize<ProposedTripPlanResponse>(json, JsonOptions)
        ?? throw new InvalidDataException("The saved planner proposal is invalid.");

    public static string ComputeHash(Trip trip)
    {
        var json = Serialize(FromTrip(trip));
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json))).ToLowerInvariant();
    }

    public static string? SerializeImageUrls(IReadOnlyList<string> urls) =>
        urls.Count == 0 ? null : JsonSerializer.Serialize(urls);

    public static IReadOnlyList<string> DeserializeImageUrls(string? json) =>
        string.IsNullOrWhiteSpace(json) ? [] : JsonSerializer.Deserialize<List<string>>(json) ?? [];
}
