namespace backend.Entities;

public class TripMember
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Trip Trip { get; set; } = null!;
    public required string Name { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<TripStepParticipant> StepParticipants { get; set; } = [];
}
