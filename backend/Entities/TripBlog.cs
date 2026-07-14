namespace backend.Entities;

public class TripBlog
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Trip Trip { get; set; } = null!;
    public required string Locale { get; set; }
    public required string DraftBlobName { get; set; }
    public string? PublishedBlobName { get; set; }
    public string? PublicShareToken { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public string? GeneratedProvider { get; set; }
    public string? GeneratedModel { get; set; }
}
