namespace backend.DTOs;

public record CurrentUserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    DateTimeOffset CreatedAt);

public record AuthResponse(
    string Token,
    DateTimeOffset ExpiresAt,
    CurrentUserResponse User);
