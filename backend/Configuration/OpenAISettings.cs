namespace backend.Configuration;

public class OpenAISettings
{
    public const string SectionName = "OpenAI";
    public string? ApiKey { get; set; }
}

public class AnthropicSettings
{
    public const string SectionName = "Anthropic";
    public string? ApiKey { get; set; }
}

public class GoogleAISettings
{
    public const string SectionName = "Google";
    public string? ApiKey { get; set; }
}