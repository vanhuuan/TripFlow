using Microsoft.AspNetCore.Http;

namespace backend.Services;

public interface IFileStorageService
{
    bool IsAllowedImage(IFormFile file);
    Task<string> SaveImageAsync(IFormFile file, CancellationToken cancellationToken);
}

public class LocalFileStorageService(IWebHostEnvironment environment) : IFileStorageService
{
    private static readonly Dictionary<string, string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp"
    };

    public bool IsAllowedImage(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.TryGetValue(extension, out var expectedContentType))
        {
            return false;
        }

        return file.ContentType.Equals(expectedContentType, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<string> SaveImageAsync(IFormFile file, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var uploadsPath = Path.Combine(environment.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadsPath);

        var filePath = Path.Combine(uploadsPath, fileName);
        await using var stream = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await file.CopyToAsync(stream, cancellationToken);

        return $"/uploads/{fileName}";
    }
}
