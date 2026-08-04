using System.Collections.Concurrent;
using System.Text.Json;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/trips/{tripId:guid}/planner")]
public class TripPlannerController(
    AppDbContext dbContext,
    ICurrentUserService currentUserService,
    ITripPlannerGenerationService generationService,
    IConfiguredBlogModel configuredModel,
    ILogger<TripPlannerController> logger) : ControllerBase
{
    private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> TripLocks = new();

    [HttpGet("messages")]
    public async Task<ActionResult<PlannerMessagePageResponse>> GetMessages(
        Guid tripId,
        [FromQuery] DateTimeOffset? before,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        if (!await UserOwnsTrip(tripId, userId, cancellationToken)) return NotFound();
        limit = Math.Clamp(limit, 1, 50);

        var query = dbContext.TripPlannerMessages.AsNoTracking()
            .Include(message => message.Proposal)
            .Where(message => message.TripId == tripId);
        if (before.HasValue) query = query.Where(message => message.CreatedAt < before.Value);

        var newestFirst = await query.OrderByDescending(message => message.CreatedAt).ThenByDescending(message => message.Id)
            .Take(limit).ToListAsync(cancellationToken);
        DateTimeOffset? nextBefore = newestFirst.Count == limit ? newestFirst[^1].CreatedAt : null;

        if (!before.HasValue && newestFirst.All(message => message.Proposal?.Status != PlanProposalStatus.Pending))
        {
            var pendingDraftMessage = await dbContext.TripPlannerMessages.AsNoTracking()
                .Include(message => message.Proposal)
                .Where(message => message.TripId == tripId && message.Proposal != null && message.Proposal.Status == PlanProposalStatus.Pending)
                .OrderByDescending(message => message.CreatedAt)
                .ThenByDescending(message => message.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (pendingDraftMessage is not null && newestFirst.All(message => message.Id != pendingDraftMessage.Id))
                newestFirst.Add(pendingDraftMessage);
        }

        var messages = newestFirst.OrderBy(message => message.CreatedAt).ThenBy(message => message.Id).Select(ToMessageResponse).ToList();
        return Ok(new PlannerMessagePageResponse(messages, nextBefore));
    }

    [EnableRateLimiting("planner")]
    [HttpPost("messages")]
    public async Task<ActionResult<PlannerTurnResponse>> CreateMessage(
        Guid tripId,
        CreatePlannerMessageRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var messageText = request.Message?.Trim();
        var locale = request.Locale?.Trim().ToLowerInvariant();
        if (request.ClientMessageId == Guid.Empty) ModelState.AddModelError(nameof(request.ClientMessageId), "Client message ID is required.");
        if (string.IsNullOrWhiteSpace(messageText)) ModelState.AddModelError(nameof(request.Message), "Message is required.");
        else if (messageText.Length > 4000) ModelState.AddModelError(nameof(request.Message), "Message cannot exceed 4000 characters.");
        if (locale is not ("vi" or "en")) ModelState.AddModelError(nameof(request.Locale), "Locale must be vi or en.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var tripLock = TripLocks.GetOrAdd(tripId, _ => new SemaphoreSlim(1, 1));
        if (!await tripLock.WaitAsync(0, cancellationToken))
            return Conflict(new ProblemDetails { Status = StatusCodes.Status409Conflict, Title = "A planner response is already being generated for this trip." });

        try
        {
            var existingUserMessage = await dbContext.TripPlannerMessages.AsNoTracking()
                .SingleOrDefaultAsync(message =>
                    message.TripId == tripId &&
                    message.Trip.UserId == userId &&
                    message.ClientMessageId == request.ClientMessageId,
                    cancellationToken);
            if (existingUserMessage is not null)
            {
                var existingAssistant = await dbContext.TripPlannerMessages.AsNoTracking().Include(message => message.Proposal)
                    .SingleOrDefaultAsync(message => message.ReplyToMessageId == existingUserMessage.Id, cancellationToken);
                if (existingAssistant is not null)
                    return Ok(new PlannerTurnResponse(ToMessageResponse(existingUserMessage), ToMessageResponse(existingAssistant)));
            }

            var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
            if (trip is null) return NotFound();

            var latestPending = await dbContext.TripPlanProposals
                .Where(proposal => proposal.TripId == tripId && proposal.Status == PlanProposalStatus.Pending)
                .OrderByDescending(proposal => proposal.CreatedAt)
                .ThenByDescending(proposal => proposal.Id)
                .FirstOrDefaultAsync(cancellationToken);
            var livePlanHash = PlannerPlanUtilities.ComputeHash(trip);
            if (latestPending is not null && !string.Equals(latestPending.BasePlanHash, livePlanHash, StringComparison.Ordinal))
            {
                latestPending.Status = PlanProposalStatus.Stale;
                await dbContext.SaveChangesAsync(cancellationToken);
                latestPending = null;
            }
            var workingPlan = latestPending is null
                ? PlannerPlanUtilities.FromTrip(trip)
                : PlannerPlanUtilities.Deserialize(latestPending.ProposedPlanJson);

            var recent = await dbContext.TripPlannerMessages.AsNoTracking().Where(message => message.TripId == tripId)
                .OrderByDescending(message => message.CreatedAt).Take(100).ToListAsync(cancellationToken);
            var history = SelectHistory(recent);
            var now = DateTimeOffset.UtcNow;
            var userMessage = new TripPlannerMessage
            {
                Id = Guid.NewGuid(), TripId = tripId, Role = PlannerMessageRole.User, Content = messageText!, Locale = locale!,
                ClientMessageId = request.ClientMessageId, CreatedAt = now
            };
            history.Add(userMessage);

            var model = configuredModel.Get();
            PlannerGenerationResult generated;
            try
            {
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(90));
                generated = await generationService.GenerateAsync(trip, workingPlan, history, userId, locale!, model, timeout.Token);
            }
            catch (TripPlannerGenerationException exception)
            {
                logger.LogWarning(exception, "Planner generation failed for trip {TripId}", tripId);
                return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: exception.Message);
            }

            if (generated.ProposedPlan is not null && !ValidateProposedPlan(generated.ProposedPlan, trip))
                return ValidationProblem(ModelState);

            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            var assistantMessage = new TripPlannerMessage
            {
                Id = Guid.NewGuid(), TripId = tripId, Role = PlannerMessageRole.Assistant, Content = generated.AssistantMessage,
                Locale = locale!, ReplyToMessageId = userMessage.Id, Provider = model.Provider, Model = model.ApiModelId,
                CreatedAt = now.AddTicks(1)
            };
            dbContext.TripPlannerMessages.AddRange(userMessage, assistantMessage);

            TripPlanProposal? savedProposal = null;
            if (generated.ProposedPlan is not null)
            {
                var pending = await dbContext.TripPlanProposals
                    .Where(proposal => proposal.TripId == tripId && proposal.Status == PlanProposalStatus.Pending)
                    .ToListAsync(cancellationToken);
                foreach (var proposal in pending) proposal.Status = PlanProposalStatus.Superseded;

                savedProposal = new TripPlanProposal
                {
                    Id = Guid.NewGuid(), TripId = tripId, AssistantMessageId = assistantMessage.Id,
                    BasePlanHash = livePlanHash,
                    ProposedPlanJson = PlannerPlanUtilities.Serialize(generated.ProposedPlan),
                    Status = PlanProposalStatus.Pending, CreatedAt = now.AddTicks(2)
                };
                dbContext.TripPlanProposals.Add(savedProposal);
                assistantMessage.Proposal = savedProposal;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return Ok(new PlannerTurnResponse(ToMessageResponse(userMessage), ToMessageResponse(assistantMessage)));
        }
        finally
        {
            tripLock.Release();
        }
    }

    [HttpPost("proposals/{proposalId:guid}/apply")]
    public async Task<ActionResult<TripDetailResponse>> ApplyProposal(Guid tripId, Guid proposalId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var proposal = await dbContext.TripPlanProposals.Include(item => item.AssistantMessage)
            .SingleOrDefaultAsync(item => item.Id == proposalId && item.TripId == tripId && item.Trip.UserId == userId, cancellationToken);
        if (proposal is null) return NotFound();

        var trip = await GetOwnedTrip(tripId, userId, cancellationToken);
        if (trip is null) return NotFound();
        if (proposal.Status == PlanProposalStatus.Applied) return Ok(ToTripDetailResponse(trip));
        if (proposal.Status != PlanProposalStatus.Pending)
            return Conflict(new ProblemDetails { Status = StatusCodes.Status409Conflict, Title = $"This proposal is {proposal.Status.ToString().ToLowerInvariant()} and cannot be applied." });

        if (!string.Equals(proposal.BasePlanHash, PlannerPlanUtilities.ComputeHash(trip), StringComparison.Ordinal))
        {
            proposal.Status = PlanProposalStatus.Stale;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Conflict(new ProblemDetails { Status = StatusCodes.Status409Conflict, Title = "The itinerary changed after this proposal was created. Ask the planner for a revised proposal." });
        }

        ProposedTripPlanResponse plan;
        try { plan = PlannerPlanUtilities.Deserialize(proposal.ProposedPlanJson); }
        catch (Exception exception)
        {
            logger.LogError(exception, "Stored planner proposal {ProposalId} is invalid", proposalId);
            return Problem(statusCode: StatusCodes.Status500InternalServerError, title: "The saved proposal is invalid.");
        }
        if (!ValidateProposedPlan(plan, trip)) return ValidationProblem(ModelState);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        trip.Title = plan.Title.Trim();
        trip.Destination = plan.Destination.Trim();
        trip.Description = NormalizeOptional(plan.Description);
        trip.StartDate = plan.StartDate;
        trip.EndDate = plan.EndDate;
        trip.CurrencyCode = plan.CurrencyCode.Trim().ToUpperInvariant();
        trip.UpdatedAt = now;

        var proposedExistingIds = plan.Steps.Where(step => step.Id.HasValue).Select(step => step.Id!.Value).ToHashSet();
        foreach (var removed in trip.Steps.Where(step => !proposedExistingIds.Contains(step.Id)).ToList())
        {
            trip.Steps.Remove(removed);
            dbContext.TripSteps.Remove(removed);
        }

        var existingById = trip.Steps.ToDictionary(step => step.Id);
        for (var index = 0; index < plan.Steps.Count; index++)
        {
            var draft = plan.Steps[index];
            TripStep step;
            if (draft.Id.HasValue)
            {
                step = existingById[draft.Id.Value];
            }
            else
            {
                step = new TripStep { Id = Guid.NewGuid(), TripId = trip.Id, Trip = trip, Title = draft.Title.Trim(), CreatedAt = now };
                dbContext.TripSteps.Add(step);
            }

            step.Title = draft.Title.Trim();
            step.Description = NormalizeOptional(draft.Description);
            step.Type = draft.Type;
            step.Status = draft.Status;
            step.ScheduledAt = draft.ScheduledAt;
            step.CostAmount = draft.CostAmount;
            step.GoogleMapsUrl = NormalizeOptional(draft.GoogleMapsUrl);
            step.ExternalUrl = NormalizeOptional(draft.ExternalUrl);
            step.ImageUrlsJson = PlannerPlanUtilities.SerializeImageUrls(draft.ImageUrls.Select(value => value.Trim()).Where(value => value.Length > 0).Distinct().ToList());
            step.OrderIndex = index;
            step.UpdatedAt = now;
            var requestedParticipantIds = draft.ParticipantMemberIds.ToHashSet();
            foreach (var participant in step.Participants.Where(item => !requestedParticipantIds.Contains(item.TripMemberId)).ToList())
                dbContext.TripStepParticipants.Remove(participant);
            var existingParticipantIds = step.Participants.Select(item => item.TripMemberId).ToHashSet();
            foreach (var memberId in requestedParticipantIds.Where(id => !existingParticipantIds.Contains(id)))
                step.Participants.Add(new TripStepParticipant { TripStepId = step.Id, TripMemberId = memberId });
        }

        proposal.Status = PlanProposalStatus.Applied;
        proposal.AppliedAt = now;
        dbContext.TripPlannerMessages.Add(new TripPlannerMessage
        {
            Id = Guid.NewGuid(), TripId = trip.Id, Role = PlannerMessageRole.Assistant,
            Content = proposal.AssistantMessage.Locale == "vi" ? "Các thay đổi trong kế hoạch đã được áp dụng." : "The plan changes were applied.",
            Locale = proposal.AssistantMessage.Locale, Provider = proposal.AssistantMessage.Provider, Model = proposal.AssistantMessage.Model,
            CreatedAt = now.AddTicks(1)
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(ToTripDetailResponse(trip));
    }

    [HttpPost("proposals/{proposalId:guid}/dismiss")]
    public async Task<IActionResult> DismissProposal(Guid tripId, Guid proposalId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var proposal = await dbContext.TripPlanProposals.SingleOrDefaultAsync(
            item => item.Id == proposalId && item.TripId == tripId && item.Trip.UserId == userId, cancellationToken);
        if (proposal is null) return NotFound();
        if (proposal.Status == PlanProposalStatus.Dismissed) return NoContent();
        if (proposal.Status != PlanProposalStatus.Pending)
            return Conflict(new ProblemDetails { Status = StatusCodes.Status409Conflict, Title = $"This proposal is already {proposal.Status.ToString().ToLowerInvariant()}." });
        proposal.Status = PlanProposalStatus.Dismissed;
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private bool ValidateProposedPlan(ProposedTripPlanResponse plan, Trip trip)
    {
        if (string.IsNullOrWhiteSpace(plan.Title) || plan.Title.Trim().Length > 150) ModelState.AddModelError("proposedPlan.title", "Title is required and cannot exceed 150 characters.");
        if (string.IsNullOrWhiteSpace(plan.Destination) || plan.Destination.Trim().Length > 150) ModelState.AddModelError("proposedPlan.destination", "Destination is required and cannot exceed 150 characters.");
        if (plan.Description?.Trim().Length > 2000) ModelState.AddModelError("proposedPlan.description", "Description cannot exceed 2000 characters.");
        if (plan.StartDate.HasValue && plan.EndDate.HasValue && plan.EndDate.Value < plan.StartDate.Value) ModelState.AddModelError("proposedPlan.endDate", "End date must be on or after start date.");
        if (string.IsNullOrWhiteSpace(plan.CurrencyCode) || plan.CurrencyCode.Trim().Length != 3 || !plan.CurrencyCode.Trim().All(char.IsLetter))
            ModelState.AddModelError("proposedPlan.currencyCode", "Currency code must contain three letters.");
        if (plan.Steps is null) { ModelState.AddModelError("proposedPlan.steps", "Steps are required."); return false; }

        var currentIds = trip.Steps.Select(step => step.Id).ToHashSet();
        var proposedIds = plan.Steps.Where(step => step.Id.HasValue).Select(step => step.Id!.Value).ToList();
        if (proposedIds.Distinct().Count() != proposedIds.Count || proposedIds.Any(id => !currentIds.Contains(id)))
            ModelState.AddModelError("proposedPlan.steps", "Existing step IDs must be unique and belong to this trip.");
        if (plan.Steps.Select(step => step.Key?.Trim()).Any(string.IsNullOrWhiteSpace) || plan.Steps.Select(step => step.Key.Trim()).Distinct(StringComparer.Ordinal).Count() != plan.Steps.Count)
            ModelState.AddModelError("proposedPlan.steps", "Every step key must be present and unique.");

        var memberIds = trip.Members.Select(member => member.Id).ToHashSet();
        for (var index = 0; index < plan.Steps.Count; index++)
        {
            var step = plan.Steps[index];
            var key = $"proposedPlan.steps[{index}]";
            if (!step.Id.HasValue && (string.IsNullOrWhiteSpace(step.Key) || !step.Key.StartsWith("new-", StringComparison.OrdinalIgnoreCase))) ModelState.AddModelError($"{key}.key", "New step keys must begin with new-.");
            if (string.IsNullOrWhiteSpace(step.Title) || step.Title.Trim().Length > 150) ModelState.AddModelError($"{key}.title", "Step title is required and cannot exceed 150 characters.");
            if (step.Description?.Trim().Length > 2000) ModelState.AddModelError($"{key}.description", "Step description cannot exceed 2000 characters.");
            if (!Enum.IsDefined(step.Type)) ModelState.AddModelError($"{key}.type", "Step type is invalid.");
            if (!Enum.IsDefined(step.Status)) ModelState.AddModelError($"{key}.status", "Step status is invalid.");
            if (step.CostAmount is < 0 or > 9999999999.99m) ModelState.AddModelError($"{key}.costAmount", "Step cost is outside the supported range.");
            ValidateOptionalLength(step.GoogleMapsUrl, 2048, $"{key}.googleMapsUrl");
            ValidateOptionalLength(step.ExternalUrl, 2048, $"{key}.externalUrl");
            if (step.ImageUrls is null || step.ImageUrls.Any(url => string.IsNullOrWhiteSpace(url) || url.Trim().Length > 2048)) ModelState.AddModelError($"{key}.imageUrls", "Image URLs must be non-empty and no longer than 2048 characters.");
            if (step.ParticipantMemberIds is null || step.ParticipantMemberIds.Distinct().Count() != step.ParticipantMemberIds.Count || step.ParticipantMemberIds.Any(id => !memberIds.Contains(id)))
                ModelState.AddModelError($"{key}.participantMemberIds", "Participants must be unique members of this trip.");
        }
        return ModelState.IsValid;
    }

    private void ValidateOptionalLength(string? value, int maxLength, string key)
    {
        if (value?.Trim().Length > maxLength) ModelState.AddModelError(key, $"Value cannot exceed {maxLength} characters.");
    }

    private static List<TripPlannerMessage> SelectHistory(IReadOnlyList<TripPlannerMessage> newestFirst)
    {
        const int characterBudget = 24000;
        var selected = new List<TripPlannerMessage>();
        var used = 0;
        foreach (var message in newestFirst)
        {
            if (selected.Count >= 6 && used + message.Content.Length > characterBudget) break;
            selected.Add(message);
            used += message.Content.Length;
        }
        selected.Reverse();
        return selected;
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        if (currentUserService.UserId is { } id) { userId = id; return true; }
        userId = Guid.Empty; return false;
    }

    private Task<bool> UserOwnsTrip(Guid tripId, Guid userId, CancellationToken cancellationToken) =>
        dbContext.Trips.AnyAsync(trip => trip.Id == tripId && trip.UserId == userId, cancellationToken);

    private Task<Trip?> GetOwnedTrip(Guid tripId, Guid userId, CancellationToken cancellationToken) =>
        dbContext.Trips.Include(trip => trip.Members).Include(trip => trip.Steps).ThenInclude(step => step.Participants)
            .SingleOrDefaultAsync(trip => trip.Id == tripId && trip.UserId == userId, cancellationToken);

    private static string? NormalizeOptional(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static PlannerMessageResponse ToMessageResponse(TripPlannerMessage message) => new(
        message.Id, message.Role, message.Content, message.Provider, message.Model, message.CreatedAt,
        message.Proposal is null ? null : new PlanProposalResponse(
            message.Proposal.Id, message.Proposal.Status, PlannerPlanUtilities.Deserialize(message.Proposal.ProposedPlanJson),
            message.Proposal.CreatedAt, message.Proposal.AppliedAt));

    private static TripDetailResponse ToTripDetailResponse(Trip trip) => new(
        trip.Id, trip.Title, trip.Destination, trip.Description, trip.StartDate, trip.EndDate, trip.CoverImageUrl,
        trip.CurrencyCode, trip.Steps.Sum(step => step.CostAmount ?? 0m), trip.Status, trip.CreatedAt, trip.UpdatedAt,
        trip.IsPublicShared, trip.PublicShareToken,
        trip.Members.OrderBy(member => member.CreatedAt).Select(member => new TripMemberResponse(member.Id, member.Name)).ToList(),
        trip.Steps.OrderBy(step => step.OrderIndex).Select(step => new TripStepResponse(
            step.Id, step.TripId, step.Title, step.Description, step.Type, step.Status, step.ScheduledAt, step.CostAmount,
            step.GoogleMapsUrl, step.ExternalUrl, PlannerPlanUtilities.DeserializeImageUrls(step.ImageUrlsJson),
            step.Participants.Select(participant => participant.TripMemberId).ToList(), step.OrderIndex, step.CreatedAt, step.UpdatedAt)).ToList());
}
