using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers;

[Authorize]
[EnableRateLimiting("places")]
[ApiController]
[Route("api/places")]
public sealed class PlacesController(IGooglePlacesService googlePlacesService, ILogger<PlacesController> logger) : ControllerBase
{
    [HttpGet("autocomplete")]
    public async Task<ActionResult<IReadOnlyList<PlaceSuggestionResponse>>> Autocomplete(
        [FromQuery] string? input,
        [FromQuery] string? languageCode,
        CancellationToken cancellationToken)
    {
        var normalizedInput = input?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedInput) || normalizedInput.Length < 2)
        {
            ModelState.AddModelError(nameof(input), "Enter at least two characters.");
        }
        else if (normalizedInput.Length > 200)
        {
            ModelState.AddModelError(nameof(input), "Search text must be 200 characters or fewer.");
        }

        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var normalizedLanguageCode = languageCode?.StartsWith("vi", StringComparison.OrdinalIgnoreCase) == true ? "vi" : "en";
        try
        {
            return Ok(await googlePlacesService.AutocompleteAsync(normalizedInput!, normalizedLanguageCode, cancellationToken));
        }
        catch (GooglePlacesException exception)
        {
            logger.LogWarning(exception, "Place autocomplete is unavailable.");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: exception.Message);
        }
    }
}
