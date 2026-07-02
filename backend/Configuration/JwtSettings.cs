using System.ComponentModel.DataAnnotations;

namespace backend.Configuration;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    [Required]
    public required string Issuer { get; init; }

    [Required]
    public required string Audience { get; init; }

    [Required, MinLength(32)]
    public required string SigningKey { get; init; }

    [Range(1, 10080)]
    public int ExpirationMinutes { get; init; } = 60;
}
