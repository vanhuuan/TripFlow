using System.Security.Cryptography;
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
    ICurrentUserService currentUserService,
    IConfiguration configuration,
    IBlogStorageService blogStorage,
    ILogger<TripsController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TripDetailResponse>> Create(CreateTripRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var normalizedRequest = NormalizeRequest(request);
        if (!ValidateTripRequest(normalizedRequest.Title, normalizedRequest.Destination, normalizedRequest.StartDate, normalizedRequest.EndDate, normalizedRequest.CurrencyCode, normalizedRequest.Members)) return ValidationProblem(ModelState);

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
            CurrencyCode = normalizedRequest.CurrencyCode,
            Status = TripStatus.Draft,
            IsPublicShared = false,
            PublicShareToken = null,
            CreatedAt = now,
            UpdatedAt = now
        };

        foreach (var member in normalizedRequest.Members)
        {
            trip.Members.Add(new TripMember { Id = Guid.NewGuid(), Name = member.Name, CreatedAt = now });
        }

        dbContext.Trips.Add(trip);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { tripId = trip.Id }, ToDetailResponse(trip));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TripSummaryResponse>>> GetAll(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var trips = await dbContext.Trips.AsNoTracking().Include(trip => trip.Steps).Where(trip => trip.UserId == userId).OrderBy(trip => trip.StartDate == null).ThenBy(trip => trip.StartDate).ThenByDescending(trip => trip.CreatedAt).Select(trip => ToSummaryResponse(trip)).ToListAsync(cancellationToken);
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
        if (!ValidateTripRequest(normalizedRequest.Title, normalizedRequest.Destination, normalizedRequest.StartDate, normalizedRequest.EndDate, normalizedRequest.CurrencyCode, normalizedRequest.Members)) return ValidationProblem(ModelState);

        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        if (trip is null) return NotFound();

        trip.Title = normalizedRequest.Title;
        trip.Destination = normalizedRequest.Destination;
        trip.Description = normalizedRequest.Description;
        trip.StartDate = normalizedRequest.StartDate;
        trip.EndDate = normalizedRequest.EndDate;
        trip.CoverImageUrl = normalizedRequest.CoverImageUrl;
        trip.CurrencyCode = normalizedRequest.CurrencyCode;
        trip.UpdatedAt = DateTimeOffset.UtcNow;
        SyncMembers(trip, normalizedRequest.Members);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDetailResponse(trip));
    }

    [HttpDelete("{tripId:guid}")]
    public async Task<IActionResult> Delete(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        if (trip is null) return NotFound();
        var draftBlob = trip.Blog?.DraftBlobName;
        var publishedBlob = trip.Blog?.PublishedBlobName;
        dbContext.Trips.Remove(trip);
        await dbContext.SaveChangesAsync(cancellationToken);
        await DeleteBlogBlob(draftBlob, cancellationToken);
        await DeleteBlogBlob(publishedBlob, cancellationToken);
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

    private async Task<Trip?> GetOwnedTrip(Guid tripId, Guid userId, CancellationToken cancellationToken) => await dbContext.Trips
        .Include(trip => trip.Blog)
        .Include(trip => trip.Members)
        .Include(trip => trip.Steps).ThenInclude(step => step.Participants)
        .SingleOrDefaultAsync(trip => trip.Id == tripId && trip.UserId == userId, cancellationToken);

    private async Task DeleteBlogBlob(string? blobName, CancellationToken cancellationToken)
    {
        try { await blogStorage.DeleteIfExistsAsync(blobName, cancellationToken); }
        catch (Exception exception) { logger.LogWarning(exception, "Could not delete blog blob {BlobName} after trip deletion.", blobName); }
    }

    private bool ValidateTripRequest(string title, string destination, DateOnly? startDate, DateOnly? endDate, string currencyCode, IReadOnlyList<NormalizedTripMemberRequest> members)
    {
        if (string.IsNullOrWhiteSpace(title)) ModelState.AddModelError(nameof(CreateTripRequest.Title), "Title is required.");
        if (string.IsNullOrWhiteSpace(destination)) ModelState.AddModelError(nameof(CreateTripRequest.Destination), "Destination is required.");
        if (startDate.HasValue && endDate.HasValue && endDate.Value < startDate.Value) ModelState.AddModelError(nameof(CreateTripRequest.EndDate), "End date must be on or after start date.");
        if (string.IsNullOrWhiteSpace(currencyCode) || currencyCode.Length != 3) ModelState.AddModelError(nameof(CreateTripRequest.CurrencyCode), "Currency code must be a 3-letter code.");
        if (members.Select(member => member.Name.ToUpperInvariant()).Distinct().Count() != members.Count) ModelState.AddModelError(nameof(CreateTripRequest.Members), "Trip member names must be unique.");
        return ModelState.IsValid;
    }

    private void SyncMembers(Trip trip, IReadOnlyList<NormalizedTripMemberRequest> requestedMembers)
    {
        var requestedIds = requestedMembers.Where(member => member.Id.HasValue).Select(member => member.Id!.Value).ToHashSet();
        var removedMembers = trip.Members.Where(member => !requestedIds.Contains(member.Id)).ToList();
        foreach (var removedMember in removedMembers)
        {
            trip.Members.Remove(removedMember);
        }

        foreach (var requestedMember in requestedMembers)
        {
            var existingMember = requestedMember.Id.HasValue ? trip.Members.SingleOrDefault(member => member.Id == requestedMember.Id.Value) : null;
            if (existingMember is null)
            {
                trip.Members.Add(new TripMember { Id = Guid.NewGuid(), TripId = trip.Id, Name = requestedMember.Name, CreatedAt = DateTimeOffset.UtcNow });
            }
            else
            {
                existingMember.Name = requestedMember.Name;
            }
        }
    }

    private static NormalizedTripRequest NormalizeRequest(CreateTripRequest request) => new(request.Title.Trim(), request.Destination.Trim(), NormalizeOptionalString(request.Description), request.StartDate, request.EndDate, NormalizeOptionalString(request.CoverImageUrl), NormalizeCurrencyCode(request.CurrencyCode), NormalizeMembers(request.Members));
    private static NormalizedTripRequest NormalizeRequest(UpdateTripRequest request) => new(request.Title.Trim(), request.Destination.Trim(), NormalizeOptionalString(request.Description), request.StartDate, request.EndDate, NormalizeOptionalString(request.CoverImageUrl), NormalizeCurrencyCode(request.CurrencyCode), NormalizeMembers(request.Members));
    private static IReadOnlyList<NormalizedTripMemberRequest> NormalizeMembers(IReadOnlyList<TripMemberRequest>? members) => members?.Select(member => new NormalizedTripMemberRequest(member.Id, member.Name.Trim())).Where(member => !string.IsNullOrWhiteSpace(member.Name)).ToList() ?? [];
    private static string? NormalizeOptionalString(string? value) { var trimmedValue = value?.Trim(); return string.IsNullOrEmpty(trimmedValue) ? null : trimmedValue; }
    private static string NormalizeCurrencyCode(string currencyCode) => currencyCode.Trim().ToUpperInvariant();
    private static string GenerateShareToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    private string BuildShareUrl(string token)
    {
        var frontendUrl = configuration["FrontendUrl"]?.TrimEnd('/');
        var baseUrl = string.IsNullOrWhiteSpace(frontendUrl) ? $"{Request.Scheme}://{Request.Host}" : frontendUrl;
        return $"{baseUrl}/share/{token}";
    }

    private static TripSummaryResponse ToSummaryResponse(Trip trip) => new(trip.Id, trip.Title, trip.Destination, trip.Description, trip.StartDate, trip.EndDate, trip.CoverImageUrl, trip.CurrencyCode, trip.Steps.Sum(step => step.CostAmount ?? 0m), trip.Status, trip.CreatedAt, trip.UpdatedAt, trip.IsPublicShared);
    private static TripDetailResponse ToDetailResponse(Trip trip) => new(trip.Id, trip.Title, trip.Destination, trip.Description, trip.StartDate, trip.EndDate, trip.CoverImageUrl, trip.CurrencyCode, trip.Steps.Sum(step => step.CostAmount ?? 0m), trip.Status, trip.CreatedAt, trip.UpdatedAt, trip.IsPublicShared, trip.PublicShareToken, trip.Members.OrderBy(member => member.CreatedAt).Select(ToMemberResponse).ToList(), trip.Steps.OrderBy(step => step.OrderIndex).Select(ToStepResponse).ToList());
    private static TripMemberResponse ToMemberResponse(TripMember member) => new(member.Id, member.Name);
    private static TripStepResponse ToStepResponse(TripStep step) => new(step.Id, step.TripId, step.Title, step.Description, step.Type, step.Status, step.ScheduledAt, step.CostAmount, step.GoogleMapsUrl, step.ExternalUrl, DeserializeImageUrls(step.ImageUrlsJson), step.Participants.Select(participant => participant.TripMemberId).ToList(), step.OrderIndex, step.CreatedAt, step.UpdatedAt);
    private static IReadOnlyList<string> DeserializeImageUrls(string? value) => string.IsNullOrWhiteSpace(value) ? [] : (JsonSerializer.Deserialize<List<string>>(value) ?? []);

    private sealed record NormalizedTripRequest(string Title, string Destination, string? Description, DateOnly? StartDate, DateOnly? EndDate, string? CoverImageUrl, string CurrencyCode, IReadOnlyList<NormalizedTripMemberRequest> Members);
    private sealed record NormalizedTripMemberRequest(Guid? Id, string Name);
}
