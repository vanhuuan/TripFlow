using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext dbContext,
    IPasswordHasher<User> passwordHasher,
    ITokenService tokenService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponse>> Signup([FromBody] SignupRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        var displayName = request.DisplayName.Trim();
        var normalizedEmail = NormalizeEmail(email);

        if (displayName.Length < 2)
        {
            ModelState.AddModelError(nameof(SignupRequest.DisplayName), "Display name must be at least 2 characters.");
            return ValidationProblem(ModelState);
        }

        var emailExists = await dbContext.Users
            .AnyAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            return Conflict(new { message = "An account with this email already exists." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            NormalizedEmail = normalizedEmail,
            DisplayName = displayName,
            PasswordHash = string.Empty,
            CreatedAt = DateTimeOffset.UtcNow
        };

        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(CreateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await dbContext.Users
            .SingleOrDefaultAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

        if (user is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var passwordResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (passwordResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(CreateAuthResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserResponse>> Me(CancellationToken cancellationToken)
    {
        if (currentUserService.UserId is not { } userId)
        {
            return Unauthorized();
        }

        var user = await dbContext.Users.FindAsync([userId], cancellationToken);

        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(ToCurrentUserResponse(user));
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var (token, expiresAt) = tokenService.CreateToken(user);
        return new AuthResponse(token, expiresAt, ToCurrentUserResponse(user));
    }

    private static CurrentUserResponse ToCurrentUserResponse(User user) =>
        new(user.Id, user.Email, user.DisplayName, user.CreatedAt);

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();
}
