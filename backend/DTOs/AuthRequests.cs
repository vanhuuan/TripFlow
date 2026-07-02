using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public record SignupRequest(
    [property: Required, EmailAddress, MaxLength(256)] string Email,
    [property: Required, MinLength(2), MaxLength(100)] string DisplayName,
    [property: Required, MinLength(8), MaxLength(128)] string Password);

public record LoginRequest(
    [property: Required, EmailAddress, MaxLength(256)] string Email,
    [property: Required] string Password);
