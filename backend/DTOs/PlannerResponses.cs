using backend.Entities;

namespace backend.DTOs;

public record ProposedTripPlanResponse(
    string Title,
    string Destination,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string CurrencyCode,
    IReadOnlyList<ProposedTripStepResponse> Steps);

public record ProposedTripStepResponse(
    string Key,
    Guid? Id,
    string Title,
    string? Description,
    TripStepType Type,
    TripStepStatus Status,
    DateTimeOffset? ScheduledAt,
    decimal? CostAmount,
    string? GoogleMapsUrl,
    string? ExternalUrl,
    IReadOnlyList<string> ImageUrls,
    IReadOnlyList<Guid> ParticipantMemberIds);

public record PlanProposalResponse(
    Guid Id,
    PlanProposalStatus Status,
    ProposedTripPlanResponse Plan,
    DateTimeOffset CreatedAt,
    DateTimeOffset? AppliedAt);

public record PlannerMessageResponse(
    Guid Id,
    PlannerMessageRole Role,
    string Content,
    string? Provider,
    string? Model,
    DateTimeOffset CreatedAt,
    PlanProposalResponse? Proposal);

public record PlannerMessagePageResponse(
    IReadOnlyList<PlannerMessageResponse> Messages,
    DateTimeOffset? NextBefore);

public record PlannerTurnResponse(
    PlannerMessageResponse UserMessage,
    PlannerMessageResponse AssistantMessage);
