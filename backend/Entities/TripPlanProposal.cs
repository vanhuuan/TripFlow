namespace backend.Entities;

public class TripPlanProposal
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Trip Trip { get; set; } = null!;
    public Guid AssistantMessageId { get; set; }
    public TripPlannerMessage AssistantMessage { get; set; } = null!;
    public required string BasePlanHash { get; set; }
    public required string ProposedPlanJson { get; set; }
    public PlanProposalStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? AppliedAt { get; set; }
}

public enum PlanProposalStatus
{
    Pending = 0,
    Applied = 1,
    Dismissed = 2,
    Superseded = 3,
    Stale = 4
}
