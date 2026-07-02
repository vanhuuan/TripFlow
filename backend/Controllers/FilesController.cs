using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FilesController(IFileStorageService fileStorageService) : ControllerBase
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024;

    [HttpPost("upload")]
    [RequestSizeLimit(MaxFileSizeBytes)]
    public async Task<ActionResult<FileUploadResponse>> Upload(
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file is null)
        {
            ModelState.AddModelError(nameof(file), "File is required.");
            return ValidationProblem(ModelState);
        }

        if (file.Length == 0)
        {
            ModelState.AddModelError(nameof(file), "File cannot be empty.");
            return ValidationProblem(ModelState);
        }

        if (file.Length > MaxFileSizeBytes)
        {
            ModelState.AddModelError(nameof(file), "File must be 5MB or smaller.");
            return ValidationProblem(ModelState);
        }

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) || !fileStorageService.IsAllowedImage(file))
        {
            ModelState.AddModelError(nameof(file), "File must be a JPG, JPEG, PNG, or WEBP image.");
            return ValidationProblem(ModelState);
        }

        var url = await fileStorageService.SaveImageAsync(file, cancellationToken);

        return Ok(new FileUploadResponse(url));
    }
}
