namespace backend.Entities;

public class TripStep
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Trip Trip { get; set; } = null!;
    public required string Title { get; set; }
    public string? Description { get; set; }
    public TripStepType Type { get; set; }
    public TripStepStatus Status { get; set; }
    public DateTimeOffset? ScheduledAt { get; set; }
    public string? GoogleMapsUrl { get; set; }
    public string? ExternalUrl { get; set; }
    public string? TicketImageUrl { get; set; }
    public string? PlaceImageUrl { get; set; }
    public int OrderIndex { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public enum TripStepType
{
    Place = 0,
    Transport = 1,
    Hotel = 2,
    Restaurant = 3,
    Activity = 4,
    Note = 5
}

public enum TripStepStatus
{
    Todo = 0,
    Done = 1,
    Skipped = 2
}
