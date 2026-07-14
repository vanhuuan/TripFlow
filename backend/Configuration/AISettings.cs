using System.ComponentModel.DataAnnotations;

namespace backend.Configuration;

public class AISettings
{
    public const string SectionName = "AI";

    [Required]
    public string? Provider { get; set; }

    [Required]
    public string? Model { get; set; }
}