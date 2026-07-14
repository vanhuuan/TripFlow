using backend.Data;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/public/blogs")]
public class PublicTripBlogsController(
    AppDbContext dbContext,
    IBlogStorageService blogStorage,
    ITripBlogMarkdownSerializer markdownSerializer,
    ILogger<PublicTripBlogsController> logger) : ControllerBase
{
    [HttpGet("{token}")]
    public async Task<ActionResult<PublicTripBlogResponse>> Get(
        string token,
        CancellationToken cancellationToken)
    {
        var blog = await dbContext.TripBlogs
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.PublicShareToken == token
                    && item.PublishedAt != null
                    && item.PublishedBlobName != null,
                cancellationToken);

        if (blog is null)
        {
            return NotFound();
        }

        try
        {
            var markdown = await blogStorage.ReadAsync(blog.PublishedBlobName!, cancellationToken);
            if (markdown is null)
            {
                return NotFound();
            }

            return Ok(new PublicTripBlogResponse(
                blog.Id,
                blog.Locale,
                markdownSerializer.Deserialize(markdown),
                blog.PublishedAt!.Value));
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Published blog blob is unavailable for blog {BlogId}",
                blog.Id);
            return NotFound();
        }
    }
}
