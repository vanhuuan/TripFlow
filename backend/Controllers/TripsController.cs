using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TripsController(
    AppDbContext dbContext,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TripDetailResponse>> Create(CreateTripRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var normalizedRequest = NormalizeRequest(request);
        if (!ValidateTripRequest(normalizedRequest.Title, normalizedRequest.Destination, normalizedRequest.StartDate, normalizedRequest.EndDate)) return ValidationProblem(ModelState);

        var now = DateTimeOffset.UtcNow;
        var trip = new Trip
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = normalizedRequest.Title,
            Destination = normalizedRequest.Destination,
            Description = normalizedRequest.Description,
            StartDate = normalizedRequest.StartDate,
            EndDate = normalizedRequest.EndDate,
            CoverImageUrl = normalizedRequest.CoverImageUrl,
            Status = TripStatus.Draft,
            IsPublicShared = false,
            PublicShareToken = null,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Trips.Add(trip);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { tripId = trip.Id }, ToDetailResponse(trip));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TripSummaryResponse>>> GetAll(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var trips = await dbContext.Trips.AsNoTracking().Where(trip => trip.UserId == userId).OrderBy(trip => trip.StartDate == null).ThenBy(trip => trip.StartDate).ThenByDescending(trip => trip.CreatedAt).Select(trip => ToSummaryResponse(trip)).ToListAsync(cancellationToken);
        return Ok(trips);
    }

    [HttpGet("{tripId:guid}")]
    public async Task<ActionResult<TripDetailResponse>> GetById(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        return trip is null ? NotFound() : Ok(ToDetailResponse(trip));
    }

    [HttpPut("{tripId:guid}")]
    public async Task<ActionResult<TripDetailResponse>> Update(Guid tripId, UpdateTripRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var normalizedRequest = NormalizeRequest(request);
        if (!ValidateTripRequest(normalizedRequest.Title, normalizedRequest.Destination, normalizedRequest.StartDate, normalizedRequest.EndDate)) return ValidationProblem(ModelState);

        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        if (trip is null) return NotFound();

        trip.Title = normalizedRequest.Title;
        trip.Destination = normalizedRequest.Destination;
        trip.Description = normalizedRequest.Description;
        trip.StartDate = normalizedRequest.StartDate;
        trip.EndDate = normalizedRequest.EndDate;
        trip.CoverImageUrl = normalizedRequest.CoverImageUrl;
        trip.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDetailResponse(trip));
    }

    [HttpDelete("{tripId:guid}")]
    public async Task<IActionResult> Delete(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        if (trip is null) return NotFound();
        dbContext.Trips.Remove(trip);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{tripId:guid}/start")]
    public async Task<ActionResult<TripDetailResponse>> Start(Guid tripId, CancellationToken cancellationToken) => await UpdateStatus(tripId, TripStatus.Active, cancellationToken);

    [HttpPost("{tripId:guid}/complete")]
    public async Task<ActionResult<TripDetailResponse>> Complete(Guid tripId, CancellationToken cancellationToken) => await UpdateStatus(tripId, TripStatus.Completed, cancellationToken);

    [HttpPost("{tripId:guid}/share")]
    public async Task<ActionResult<CreateShareLinkResponse>> CreateShareLink(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        if (trip is null) return NotFound();

        trip.PublicShareToken = GenerateShareToken();
        trip.IsPublicShared = true;
        trip.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new CreateShareLinkResponse(BuildShareUrl(trip.PublicShareToken), trip.PublicShareToken));
    }

    [HttpDelete("{tripId:guid}/share")]
    public async Task<IActionResult> DisableShareLink(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        if (trip is null) return NotFound();

        trip.PublicShareToken = null;
        trip.IsPublicShared = false;
        trip.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<ActionResult<TripDetailResponse>> UpdateStatus(Guid tripId, TripStatus status, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        if (trip is null) return NotFound();
        trip.Status = status;
        trip.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDetailResponse(trip));
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        if (currentUserService.UserId is { } currentUserId) { userId = currentUserId; return true; }
        userId = Guid.Empty; return false;
    }

    private async Task<Trip?> GetOwnedTrip(Guid tripId, Guid userId, CancellationToken cancellationToken) => await dbContext.Trips.Include(trip => trip.Steps).SingleOrDefaultAsync(trip => trip.Id == tripId && trip.UserId == userId, cancellationToken);

    private bool ValidateTripRequest(string title, string destination, DateOnly? startDate, DateOnly? endDate)
    {
        if (string.IsNullOrWhiteSpace(title)) ModelState.AddModelError(nameof(CreateTripRequest.Title), "Title is required.");
        if (string.IsNullOrWhiteSpace(destination)) ModelState.AddModelError(nameof(CreateTripRequest.Destination), "Destination is required.");
        if (startDate.HasValue && endDate.HasValue && endDate.Value < startDate.Value) ModelState.AddModelError(nameof(CreateTripRequest.EndDate), "End date must be on or after start date.");
        return ModelState.IsValid;
    }

    private static NormalizedTripRequest NormalizeRequest(CreateTripRequest request) => new(request.Title.Trim(), request.Destination.Trim(), NormalizeOptionalString(request.Description), request.StartDate, request.EndDate, NormalizeOptionalString(request.CoverImageUrl));
    private static NormalizedTripRequest NormalizeRequest(UpdateTripRequest request) => new(request.Title.Trim(), request.Destination.Trim(), NormalizeOptionalString(request.Description), request.StartDate, request.EndDate, NormalizeOptionalString(request.CoverImageUrl));
    private static string? NormalizeOptionalString(string? value) { var trimmedValue = value?.Trim(); return string.IsNullOrEmpty(trimmedValue) ? null : trimmedValue; }
    private static string GenerateShareToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    private string BuildShareUrl(string token) => $"{Request.Scheme}://{Request.Host}/share/{token}";

    private static TripSummaryResponse ToSummaryResponse(Trip trip) => new(trip.Id, trip.Title, trip.Destination, trip.Description, trip.StartDate, trip.EndDate, trip.CoverImageUrl, trip.Status, trip.CreatedAt, trip.UpdatedAt, trip.IsPublicShared);
    private static TripDetailResponse ToDetailResponse(Trip trip) => new(trip.Id, trip.Title, trip.Destination, trip.Description, trip.StartDate, trip.EndDate, trip.CoverImageUrl, trip.Status, trip.CreatedAt, trip.UpdatedAt, trip.IsPublicShared, trip.PublicShareToken, trip.Steps.OrderBy(step => step.OrderIndex).Select(ToStepResponse).ToList());
    private static TripStepResponse ToStepResponse(TripStep step) => new(step.Id, step.TripId, step.Title, step.Description, step.Type, step.Status, step.ScheduledAt, step.GoogleMapsUrl, step.ExternalUrl, DeserializeImageUrls(step.ImageUrlsJson), step.OrderIndex, step.CreatedAt, step.UpdatedAt);
    private static IReadOnlyList<string> DeserializeImageUrls(string? value) => string.IsNullOrWhiteSpace(value) ? [] : (JsonSerializer.Deserialize<List<string>>(value) ?? []);

    private sealed record NormalizedTripRequest(string Title, string Destination, string? Description, DateOnly? StartDate, DateOnly? EndDate, string? CoverImageUrl);
}
