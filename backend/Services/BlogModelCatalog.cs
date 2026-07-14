using backend.Configuration;
using Microsoft.Extensions.Options;

namespace backend.Services;

public sealed record ConfiguredBlogModelDefinition(string Provider, string ApiModelId);

public interface IConfiguredBlogModel
{
    ConfiguredBlogModelDefinition Get();
}

public class ConfiguredBlogModel(IOptions<AISettings> aiSettings) : IConfiguredBlogModel
{
    public ConfiguredBlogModelDefinition Get()
    {
        return new ConfiguredBlogModelDefinition(
            aiSettings.Value.Provider!,
            aiSettings.Value.Model!);
    }
}
