namespace backend.Entities;

public class TripStepParticipant
{
    public Guid TripStepId { get; set; }
    public TripStep TripStep { get; set; } = null!;
    public Guid TripMemberId { get; set; }
    public TripMember TripMember { get; set; } = null!;
}
