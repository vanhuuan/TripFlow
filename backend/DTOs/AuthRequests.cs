using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public record SignupRequest(
    [Required, EmailAddress, MaxLength(256)] 
    string Email,
    [Required, MinLength(2), MaxLength(100)] 
    string DisplayName,
    [Required, MinLength(8), MaxLength(128)] 
    string Password);

public record LoginRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required] string Password);
