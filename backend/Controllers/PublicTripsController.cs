using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.Json;

namespace backend.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/public/trips")]
public class PublicTripsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{token}")]
    public async Task<ActionResult<PublicTripDetailResponse>> GetByToken(string token, CancellationToken cancellationToken)
    {
        var trip = await dbContext.Trips
            .AsNoTracking()
            .Include(trip => trip.Steps)
            .SingleOrDefaultAsync(trip => trip.PublicShareToken == token && trip.IsPublicShared, cancellationToken);

        return trip is null ? NotFound() : Ok(ToResponse(trip));
    }

    private static PublicTripDetailResponse ToResponse(Trip trip) => new(
        trip.Id,
        trip.Title,
        trip.Destination,
        trip.Description,
        trip.CoverImageUrl,
        trip.CurrencyCode,
        trip.Steps.OrderBy(step => step.OrderIndex).Select(ToStepResponse).ToList());

    private static PublicTripStepResponse ToStepResponse(TripStep step) => new(
        step.Id,
        step.Title,
        step.Description,
        step.Type,
        step.Status,
        step.ScheduledAt?.ToString("HH:mm", CultureInfo.InvariantCulture),
        step.GoogleMapsUrl,
        step.ExternalUrl,
        DeserializeImageUrls(step.ImageUrlsJson),
        step.OrderIndex);

    private static IReadOnlyList<string> DeserializeImageUrls(string? value) => string.IsNullOrWhiteSpace(value) ? [] : (JsonSerializer.Deserialize<List<string>>(value) ?? []);
}
