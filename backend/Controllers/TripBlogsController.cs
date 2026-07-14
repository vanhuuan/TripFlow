using System.Security.Cryptography;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace backend.Controllers;

[Authorize, ApiController, Route("api/trips/{tripId:guid}/blog")]
public class TripBlogsController(AppDbContext dbContext, ICurrentUserService currentUserService, ITripBlogGenerationService generationService, IConfiguredBlogModel configuredModel, IBlogStorageService blogStorage, ITripBlogMarkdownSerializer markdownSerializer, IConfiguration configuration, ILogger<TripBlogsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TripBlogResponse>> Get(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized(); var blog = await GetOwnedBlog(tripId, userId, cancellationToken); if (blog is null) return NotFound();
        try { return Ok(await ToResponseAsync(blog, cancellationToken)); } catch (Exception exception) { return StorageProblem(exception, blog.Id); }
    }
    [HttpPost("generate")]
    public async Task<ActionResult<TripBlogResponse>> Generate(Guid tripId, GenerateTripBlogRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized(); var locale = request.Locale?.Trim().ToLowerInvariant();
        if (locale is not ("vi" or "en")) { ModelState.AddModelError(nameof(request.Locale), "Locale must be vi or en."); return ValidationProblem(ModelState); }
        var model = configuredModel.Get();
        var trip = await dbContext.Trips.Include(item => item.Steps).Include(item => item.Blog).SingleOrDefaultAsync(item => item.Id == tripId && item.UserId == userId, cancellationToken); if (trip is null) return NotFound();
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken); timeout.CancelAfter(TimeSpan.FromSeconds(90));
            var content = await generationService.GenerateAsync(trip, userId, locale, model, timeout.Token); var now = DateTimeOffset.UtcNow; var blog = trip.Blog; var blogId = blog?.Id ?? Guid.NewGuid();
            var newBlob = await blogStorage.SaveAsync(blogId, BlogDocumentKind.Draft, markdownSerializer.Serialize(content), cancellationToken); var oldBlob = blog?.DraftBlobName;
            try
            {
                if (blog is null) { blog = new TripBlog { Id = blogId, TripId = trip.Id, Locale = locale, DraftBlobName = newBlob, GeneratedAt = now, UpdatedAt = now }; dbContext.TripBlogs.Add(blog); } else { blog.Locale = locale; blog.DraftBlobName = newBlob; blog.GeneratedAt = now; blog.UpdatedAt = now; }
                blog.GeneratedProvider = model.Provider; blog.GeneratedModel = model.ApiModelId; await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                await SafeDelete(newBlob, cancellationToken);
                throw;
            }
            await SafeDelete(oldBlob, cancellationToken); return Ok(await ToResponseAsync(blog, cancellationToken));
        }
        catch (TripBlogGenerationException exception) { logger.LogWarning(exception, "Blog generation failed for trip {TripId}", tripId); return Problem(statusCode: 503, title: exception.Message); }
        catch (Exception exception) { return StorageProblem(exception, trip.Blog?.Id); }
    }
    [HttpPut]
    public async Task<ActionResult<TripBlogResponse>> Update(Guid tripId, UpdateTripBlogRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized(); var blog = await GetOwnedBlog(tripId, userId, cancellationToken); if (blog is null) return NotFound();
        try
        {
            var current = await ReadContent(blog.DraftBlobName, cancellationToken); ValidateText(request.Title, nameof(request.Title), 200); ValidateText(request.Introduction, nameof(request.Introduction), 5000); ValidateText(request.Conclusion, nameof(request.Conclusion), 5000);
            if (request.Sections is null || request.Sections.Count != current.Sections.Count || request.Sections.Select(s => s.SourceStepId).Distinct().Count() != current.Sections.Count || current.Sections.Any(s => request.Sections.All(e => e.SourceStepId != s.SourceStepId))) ModelState.AddModelError(nameof(request.Sections), "Sections must match the generated blog.");
            if (request.Sections is null) return ValidationProblem(ModelState); foreach (var section in request.Sections) { ValidateText(section.Heading, nameof(section.Heading), 200); ValidateText(section.Body, nameof(section.Body), 5000); }
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var edits = request.Sections.ToDictionary(s => s.SourceStepId); var updated = current with { Title = request.Title.Trim(), Introduction = request.Introduction.Trim(), Conclusion = request.Conclusion.Trim(), Sections = current.Sections.Select(s => s with { Heading = edits[s.SourceStepId].Heading.Trim(), Body = edits[s.SourceStepId].Body.Trim() }).ToList() };
            var newBlob = await blogStorage.SaveAsync(blog.Id, BlogDocumentKind.Draft, markdownSerializer.Serialize(updated), cancellationToken); var oldBlob = blog.DraftBlobName;
            try { blog.DraftBlobName = newBlob; blog.UpdatedAt = DateTimeOffset.UtcNow; await dbContext.SaveChangesAsync(cancellationToken); } catch { await SafeDelete(newBlob, cancellationToken); throw; }
            await SafeDelete(oldBlob, cancellationToken); return Ok(await ToResponseAsync(blog, cancellationToken));
        }
        catch (Exception exception) { return StorageProblem(exception, blog.Id); }
    }
    [HttpPost("publish")]
    public async Task<ActionResult<TripBlogResponse>> Publish(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized(); var blog = await GetOwnedBlog(tripId, userId, cancellationToken); if (blog is null) return NotFound();
        try
        {
            var markdown = await blogStorage.ReadAsync(blog.DraftBlobName, cancellationToken) ?? throw new InvalidDataException("Draft blog blob is missing."); markdownSerializer.Deserialize(markdown);
            var newBlob = await blogStorage.SaveAsync(blog.Id, BlogDocumentKind.Published, markdown, cancellationToken); var oldBlob = blog.PublishedBlobName;
            try { blog.PublishedBlobName = newBlob; blog.PublicShareToken ??= GenerateShareToken(); blog.PublishedAt = DateTimeOffset.UtcNow; blog.UpdatedAt = DateTimeOffset.UtcNow; await dbContext.SaveChangesAsync(cancellationToken); } catch { await SafeDelete(newBlob, cancellationToken); throw; }
            await SafeDelete(oldBlob, cancellationToken); return Ok(await ToResponseAsync(blog, cancellationToken));
        }
        catch (Exception exception) { return StorageProblem(exception, blog.Id); }
    }
    [HttpDelete("publish")]
    public async Task<IActionResult> Unpublish(Guid tripId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized(); var blog = await GetOwnedBlog(tripId, userId, cancellationToken); if (blog is null) return NotFound(); var oldBlob = blog.PublishedBlobName;
        blog.PublicShareToken = null; blog.PublishedAt = null; blog.PublishedBlobName = null; blog.UpdatedAt = DateTimeOffset.UtcNow; await dbContext.SaveChangesAsync(cancellationToken); await SafeDelete(oldBlob, cancellationToken); return NoContent();
    }
    private bool TryGetCurrentUserId(out Guid userId) { if (currentUserService.UserId is { } id) { userId = id; return true; } userId = Guid.Empty; return false; }
    private Task<TripBlog?> GetOwnedBlog(Guid tripId, Guid userId, CancellationToken cancellationToken) => dbContext.TripBlogs.SingleOrDefaultAsync(blog => blog.TripId == tripId && blog.Trip.UserId == userId, cancellationToken);
    private async Task<TripBlogContentResponse> ReadContent(string blobName, CancellationToken cancellationToken) => markdownSerializer.Deserialize(await blogStorage.ReadAsync(blobName, cancellationToken) ?? throw new InvalidDataException("Blog blob is missing."));
    private async Task<TripBlogResponse> ToResponseAsync(TripBlog blog, CancellationToken cancellationToken) => new(blog.Id, blog.TripId, blog.Locale, await ReadContent(blog.DraftBlobName, cancellationToken), blog.GeneratedAt, blog.UpdatedAt, blog.PublicShareToken is not null && blog.PublishedAt.HasValue && blog.PublishedBlobName is not null, blog.PublishedAt, blog.PublicShareToken is null ? null : BuildPublicUrl(blog.PublicShareToken), blog.GeneratedProvider, blog.GeneratedModel);
    private void ValidateText(string? value, string key, int maxLength) { if (string.IsNullOrWhiteSpace(value)) ModelState.AddModelError(key, "This field is required."); else if (value.Trim().Length > maxLength) ModelState.AddModelError(key, $"This field cannot exceed {maxLength} characters."); }
    private async Task SafeDelete(string? blobName, CancellationToken cancellationToken) { try { await blogStorage.DeleteIfExistsAsync(blobName, cancellationToken); } catch (Exception exception) { logger.LogWarning(exception, "Could not delete obsolete blog blob {BlobName}", blobName); } }
    private ObjectResult StorageProblem(Exception exception, Guid? blogId) { logger.LogError(exception, "Blog storage failed for blog {BlogId}", blogId); return Problem(statusCode: 503, title: "Blog storage is temporarily unavailable."); }
    private string BuildPublicUrl(string token) { var frontendUrl = configuration["FrontendUrl"]?.TrimEnd('/'); var baseUrl = string.IsNullOrWhiteSpace(frontendUrl) ? $"{Request.Scheme}://{Request.Host}" : frontendUrl; return $"{baseUrl}/blogs/{token}"; }
    private static string GenerateShareToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
}