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
[Route("api/trips/{tripId:guid}/steps")]
public class TripStepsController(AppDbContext dbContext, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TripStepResponse>> Create(Guid tripId, CreateTripStepRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var normalizedRequest = NormalizeRequest(request);
        if (!ValidateStepRequest(normalizedRequest.Title, normalizedRequest.Type, normalizedRequest.CostAmount)) return ValidationProblem(ModelState);
        if (!await UserOwnsTrip(tripId, userId, cancellationToken)) return NotFound();

        var maxOrderIndex = await dbContext.TripSteps.Where(step => step.TripId == tripId).Select(step => (int?)step.OrderIndex).MaxAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var step = new TripStep { Id = Guid.NewGuid(), TripId = tripId, Title = normalizedRequest.Title, Description = normalizedRequest.Description, Type = normalizedRequest.Type, Status = TripStepStatus.Todo, ScheduledAt = normalizedRequest.ScheduledAt, CostAmount = normalizedRequest.CostAmount, GoogleMapsUrl = normalizedRequest.GoogleMapsUrl, ExternalUrl = normalizedRequest.ExternalUrl, ImageUrlsJson = SerializeImageUrls(normalizedRequest.ImageUrls), OrderIndex = maxOrderIndex.GetValueOrDefault(-1) + 1, CreatedAt = now, UpdatedAt = now };
        dbContext.TripSteps.Add(step);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { tripId }, ToResponse(step));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TripStepResponse>>> GetAll(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        if (!await UserOwnsTrip(tripId, userId, cancellationToken)) return NotFound();
        var steps = await dbContext.TripSteps.AsNoTracking().Where(step => step.TripId == tripId).OrderBy(step => step.OrderIndex).ThenBy(step => step.CreatedAt).Select(step => ToResponse(step)).ToListAsync(cancellationToken);
        return Ok(steps);
    }

    [HttpPut("{stepId:guid}")]
    public async Task<ActionResult<TripStepResponse>> Update(Guid tripId, Guid stepId, UpdateTripStepRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var normalizedRequest = NormalizeRequest(request);
        if (!ValidateStepRequest(normalizedRequest.Title, normalizedRequest.Type, normalizedRequest.CostAmount)) return ValidationProblem(ModelState);
        var step = await GetOwnedStep(tripId, stepId, userId, cancellationToken);
        if (step is null) return NotFound();
        step.Title = normalizedRequest.Title; step.Description = normalizedRequest.Description; step.Type = normalizedRequest.Type; step.ScheduledAt = normalizedRequest.ScheduledAt; step.CostAmount = normalizedRequest.CostAmount; step.GoogleMapsUrl = normalizedRequest.GoogleMapsUrl; step.ExternalUrl = normalizedRequest.ExternalUrl; step.ImageUrlsJson = SerializeImageUrls(normalizedRequest.ImageUrls); step.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToResponse(step));
    }

    [HttpDelete("{stepId:guid}")]
    public async Task<IActionResult> Delete(Guid tripId, Guid stepId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var step = await GetOwnedStep(tripId, stepId, userId, cancellationToken);
        if (step is null) return NotFound();
        dbContext.TripSteps.Remove(step); await dbContext.SaveChangesAsync(cancellationToken); return NoContent();
    }

    [HttpPost("reorder")]
    public async Task<ActionResult<IReadOnlyList<TripStepResponse>>> Reorder(Guid tripId, ReorderTripStepsRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        if (!await UserOwnsTrip(tripId, userId, cancellationToken)) return NotFound();
        var steps = await dbContext.TripSteps.Where(step => step.TripId == tripId).ToListAsync(cancellationToken);
        if (!ValidateReorderRequest(request.StepIds, steps)) return ValidationProblem(ModelState);
        var stepById = steps.ToDictionary(step => step.Id);
        for (var index = 0; index < request.StepIds.Count; index++) { var step = stepById[request.StepIds[index]]; step.OrderIndex = index; step.UpdatedAt = DateTimeOffset.UtcNow; }
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(steps.OrderBy(step => step.OrderIndex).Select(ToResponse).ToList());
    }

    [HttpPost("{stepId:guid}/done")]
    public async Task<ActionResult<TripStepResponse>> MarkDone(Guid tripId, Guid stepId, CancellationToken cancellationToken) => await UpdateStatus(tripId, stepId, TripStepStatus.Done, cancellationToken);
    [HttpPost("{stepId:guid}/skip")]
    public async Task<ActionResult<TripStepResponse>> Skip(Guid tripId, Guid stepId, CancellationToken cancellationToken) => await UpdateStatus(tripId, stepId, TripStepStatus.Skipped, cancellationToken);

    private async Task<ActionResult<TripStepResponse>> UpdateStatus(Guid tripId, Guid stepId, TripStepStatus status, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var step = await GetOwnedStep(tripId, stepId, userId, cancellationToken);
        if (step is null) return NotFound();
        step.Status = status; step.UpdatedAt = DateTimeOffset.UtcNow; await dbContext.SaveChangesAsync(cancellationToken); return Ok(ToResponse(step));
    }

    private bool TryGetCurrentUserId(out Guid userId) { if (currentUserService.UserId is { } currentUserId) { userId = currentUserId; return true; } userId = Guid.Empty; return false; }
    private async Task<bool> UserOwnsTrip(Guid tripId, Guid userId, CancellationToken cancellationToken) => await dbContext.Trips.AnyAsync(trip => trip.Id == tripId && trip.UserId == userId, cancellationToken);
    private async Task<TripStep?> GetOwnedStep(Guid tripId, Guid stepId, Guid userId, CancellationToken cancellationToken) => await dbContext.TripSteps.SingleOrDefaultAsync(step => step.Id == stepId && step.TripId == tripId && step.Trip.UserId == userId, cancellationToken);
    private bool ValidateStepRequest(string title, TripStepType type, decimal? costAmount) { if (string.IsNullOrWhiteSpace(title)) ModelState.AddModelError(nameof(CreateTripStepRequest.Title), "Title is required."); if (!Enum.IsDefined(type)) ModelState.AddModelError(nameof(CreateTripStepRequest.Type), "Step type is invalid."); if (costAmount is < 0) ModelState.AddModelError(nameof(CreateTripStepRequest.CostAmount), "Cost must be zero or greater."); return ModelState.IsValid; }
    private bool ValidateReorderRequest(IReadOnlyList<Guid> stepIds, IReadOnlyList<TripStep> existingSteps) { if (stepIds.Count != existingSteps.Count) { ModelState.AddModelError(nameof(ReorderTripStepsRequest.StepIds), "Step IDs must include every step for the trip exactly once."); return false; } var distinctStepIds = stepIds.ToHashSet(); var existingStepIds = existingSteps.Select(step => step.Id).ToHashSet(); if (distinctStepIds.Count != stepIds.Count || !distinctStepIds.SetEquals(existingStepIds)) ModelState.AddModelError(nameof(ReorderTripStepsRequest.StepIds), "Step IDs must include every step for the trip exactly once."); return ModelState.IsValid; }
    private static NormalizedStepRequest NormalizeRequest(CreateTripStepRequest request) => new(request.Title.Trim(), NormalizeOptionalString(request.Description), request.Type, request.ScheduledAt, request.CostAmount, NormalizeOptionalString(request.GoogleMapsUrl), NormalizeOptionalString(request.ExternalUrl), NormalizeImageUrls(request.ImageUrls));
    private static NormalizedStepRequest NormalizeRequest(UpdateTripStepRequest request) => new(request.Title.Trim(), NormalizeOptionalString(request.Description), request.Type, request.ScheduledAt, request.CostAmount, NormalizeOptionalString(request.GoogleMapsUrl), NormalizeOptionalString(request.ExternalUrl), NormalizeImageUrls(request.ImageUrls));
    private static string? NormalizeOptionalString(string? value) { var trimmedValue = value?.Trim(); return string.IsNullOrEmpty(trimmedValue) ? null : trimmedValue; }
    private static IReadOnlyList<string> NormalizeImageUrls(IReadOnlyList<string>? urls) => urls?.Select(NormalizeOptionalString).Where(url => !string.IsNullOrEmpty(url)).Select(url => url!).ToList() ?? [];
    private static string? SerializeImageUrls(IReadOnlyList<string> urls) => urls.Count == 0 ? null : JsonSerializer.Serialize(urls);
    private static IReadOnlyList<string> DeserializeImageUrls(string? value) => string.IsNullOrWhiteSpace(value) ? [] : (JsonSerializer.Deserialize<List<string>>(value) ?? []);
    private static TripStepResponse ToResponse(TripStep step) => new(step.Id, step.TripId, step.Title, step.Description, step.Type, step.Status, step.ScheduledAt, step.CostAmount, step.GoogleMapsUrl, step.ExternalUrl, DeserializeImageUrls(step.ImageUrlsJson), step.OrderIndex, step.CreatedAt, step.UpdatedAt);
    private sealed record NormalizedStepRequest(string Title, string? Description, TripStepType Type, DateTimeOffset? ScheduledAt, decimal? CostAmount, string? GoogleMapsUrl, string? ExternalUrl, IReadOnlyList<string> ImageUrls);
}
