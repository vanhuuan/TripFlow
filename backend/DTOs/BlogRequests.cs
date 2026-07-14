namespace backend.DTOs;

public record GenerateTripBlogRequest(string Locale);

public record UpdateTripBlogRequest(
    string Title,
    string Introduction,
    string Conclusion,
    IReadOnlyList<UpdateTripBlogSectionRequest> Sections);

public record UpdateTripBlogSectionRequest(
    Guid SourceStepId,
    string Heading,
    string Body);
