namespace backend.Entities;

public class Trip
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public required string Title { get; set; }
    public required string Destination { get; set; }
    public string? Description { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? CoverImageUrl { get; set; }
    public required string CurrencyCode { get; set; }
    public TripStatus Status { get; set; }
    public string? PublicShareToken { get; set; }
    public bool IsPublicShared { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public ICollection<TripStep> Steps { get; set; } = [];
    public ICollection<TripMember> Members { get; set; } = [];
    public TripBlog? Blog { get; set; }
}

public enum TripStatus
{
    Draft = 0,
    Active = 1,
    Completed = 2
}

