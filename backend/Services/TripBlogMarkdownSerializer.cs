using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.DTOs;
namespace backend.Services;

public interface ITripBlogMarkdownSerializer { string Serialize(TripBlogContentResponse content); TripBlogContentResponse Deserialize(string markdown); }
public sealed partial class TripBlogMarkdownSerializer : ITripBlogMarkdownSerializer
{
    private const string MetadataPrefix = "<!-- tripflow-metadata:"; private const string MetadataSuffix = " -->"; private const string ReservedPrefix = "<!-- tripflow-";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public string Serialize(TripBlogContentResponse content)
    {
        var metadata = new MarkdownMetadata(1, content.Destination, content.StartDate, content.EndDate, content.CoverImageUrl, content.CurrencyCode, content.TotalCost, content.Sections.Select(s => new MarkdownSectionMetadata(s.SourceStepId, s.CostAmount, s.ScheduledAt, s.ImageUrls)).ToList());
        var encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(metadata, JsonOptions)));
        var builder = new StringBuilder(); builder.AppendLine($"{MetadataPrefix}{encoded}{MetadataSuffix}").AppendLine($"# {Escape(content.Title)}").AppendLine();
        AppendBlock(builder, "introduction", content.Introduction);
        foreach (var section in content.Sections)
        {
            builder.AppendLine($"<!-- tripflow-section:{section.SourceStepId}:start -->").AppendLine($"## {Escape(section.Heading)}").AppendLine().AppendLine(Escape(section.Body)).AppendLine($"<!-- tripflow-section:{section.SourceStepId}:end -->").AppendLine();
        }
        AppendBlock(builder, "conclusion", content.Conclusion); return builder.ToString().Replace("\r\n", "\n");
    }
    public TripBlogContentResponse Deserialize(string markdown)
    {
        try
        {
            var text = markdown.Replace("\r\n", "\n"); var first = text.IndexOf('\n'); if (first < 0) throw new InvalidDataException("Blog Markdown metadata is missing.");
            var line = text[..first]; if (!line.StartsWith(MetadataPrefix, StringComparison.Ordinal) || !line.EndsWith(MetadataSuffix, StringComparison.Ordinal)) throw new InvalidDataException("Blog Markdown metadata is invalid.");
            var encoded = line[MetadataPrefix.Length..^MetadataSuffix.Length]; var metadata = JsonSerializer.Deserialize<MarkdownMetadata>(Encoding.UTF8.GetString(Convert.FromBase64String(encoded)), JsonOptions) ?? throw new InvalidDataException("Blog Markdown metadata is invalid.");
            if (metadata.SchemaVersion != 1) throw new InvalidDataException("Blog Markdown schema version is not supported.");
            var title = TitleRegex().Match(text[(first + 1)..]); if (!title.Success) throw new InvalidDataException("Blog Markdown title is missing.");
            var matches = SectionRegex().Matches(text); if (matches.Count != metadata.Sections.Count) throw new InvalidDataException("Blog Markdown sections are invalid.");
            var details = metadata.Sections.ToDictionary(s => s.SourceStepId);
            var sections = matches.Select(match => { var id = Guid.Parse(match.Groups["id"].Value); if (!details.TryGetValue(id, out var d)) throw new InvalidDataException("Blog Markdown section metadata is missing."); return new TripBlogSectionResponse(id, Unescape(match.Groups["heading"].Value.Trim()), Unescape(match.Groups["body"].Value.Trim()), d.CostAmount, d.ScheduledAt, d.ImageUrls); }).ToList();
            return new TripBlogContentResponse(Unescape(title.Groups["title"].Value.Trim()), ReadBlock(text, "introduction"), ReadBlock(text, "conclusion"), metadata.Destination, metadata.StartDate, metadata.EndDate, metadata.CoverImageUrl, metadata.CurrencyCode, metadata.TotalCost, sections);
        }
        catch (InvalidDataException) { throw; }
        catch (Exception exception) { throw new InvalidDataException("Stored blog Markdown is invalid.", exception); }
    }
    private static void AppendBlock(StringBuilder builder, string name, string value) => builder.AppendLine($"<!-- tripflow-{name}:start -->").AppendLine(Escape(value)).AppendLine($"<!-- tripflow-{name}:end -->").AppendLine();
    private static string ReadBlock(string text, string name) { var start = $"<!-- tripflow-{name}:start -->\n"; var end = $"\n<!-- tripflow-{name}:end -->"; var i = text.IndexOf(start, StringComparison.Ordinal); if (i < 0) throw new InvalidDataException($"Blog Markdown {name} is missing."); i += start.Length; var j = text.IndexOf(end, i, StringComparison.Ordinal); if (j < 0) throw new InvalidDataException($"Blog Markdown {name} is invalid."); return Unescape(text[i..j].Trim()); }
    private static string Escape(string value) => value.Replace(ReservedPrefix, "&lt;!-- tripflow-", StringComparison.OrdinalIgnoreCase);
    private static string Unescape(string value) => value.Replace("&lt;!-- tripflow-", ReservedPrefix, StringComparison.OrdinalIgnoreCase);
    [GeneratedRegex(@"(?m)^# (?<title>[^\n]+)$")] private static partial Regex TitleRegex();
    [GeneratedRegex(@"(?ms)^<!-- tripflow-section:(?<id>[0-9a-fA-F-]{36}):start -->\n## (?<heading>[^\n]+)\n\n(?<body>.*?)\n<!-- tripflow-section:\k<id>:end -->$")] private static partial Regex SectionRegex();
    private sealed record MarkdownMetadata(int SchemaVersion, string Destination, DateOnly? StartDate, DateOnly? EndDate, string? CoverImageUrl, string CurrencyCode, decimal TotalCost, IReadOnlyList<MarkdownSectionMetadata> Sections);
    private sealed record MarkdownSectionMetadata(Guid SourceStepId, decimal? CostAmount, DateTimeOffset? ScheduledAt, IReadOnlyList<string> ImageUrls);
}