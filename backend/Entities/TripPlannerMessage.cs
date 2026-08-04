namespace backend.Entities;

public class TripPlannerMessage
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Trip Trip { get; set; } = null!;
    public PlannerMessageRole Role { get; set; }
    public required string Content { get; set; }
    public required string Locale { get; set; }
    public Guid? ClientMessageId { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public string? Provider { get; set; }
    public string? Model { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public TripPlanProposal? Proposal { get; set; }
}

public enum PlannerMessageRole
{
    User = 0,
    Assistant = 1
}
