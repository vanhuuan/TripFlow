using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace backend.Services;

public enum ImageUploadKind
{
    TripCover,
    TripStep
}

public interface IFileStorageService
{
    bool IsAllowedImage(IFormFile file);
    Task<string> SaveImageAsync(IFormFile file, ImageUploadKind kind, CancellationToken cancellationToken);
}

public sealed class BlobStorageOptions
{
    public const string SectionName = "BlobStorage";

    public string? ConnectionString { get; set; }
    public string ContainerName { get; set; } = "tripflow-images";
}

public class AzureBlobFileStorageService : IFileStorageService
{
    private const int MaxDimension = 1600;
    private const long TargetFileSizeBytes = 500 * 1024;

    private static readonly Dictionary<string, string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp"
    };

    private readonly BlobContainerClient containerClient;

    public AzureBlobFileStorageService(IOptions<BlobStorageOptions> options)
    {
        var config = options.Value;
        if (string.IsNullOrWhiteSpace(config.ConnectionString))
        {
            throw new InvalidOperationException("Blob storage configuration is missing. Configure BlobStorage:ConnectionString.");
        }

        var serviceClient = new BlobServiceClient(config.ConnectionString);
        containerClient = serviceClient.GetBlobContainerClient(config.ContainerName);
    }

    public bool IsAllowedImage(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.TryGetValue(extension, out var expectedContentType))
        {
            return false;
        }

        return file.ContentType.Equals(expectedContentType, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<string> SaveImageAsync(IFormFile file, ImageUploadKind kind, CancellationToken cancellationToken)
    {
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

        var folder = kind switch
        {
            ImageUploadKind.TripCover => "trip-covers",
            ImageUploadKind.TripStep => "trip-steps",
            _ => "uploads"
        };

        var blobName = $"{folder}/{Guid.NewGuid():N}.webp";
        var blobClient = containerClient.GetBlobClient(blobName);

        await using var inputStream = file.OpenReadStream();
        using var image = await Image.LoadAsync(inputStream, cancellationToken);

        if (image.Width > MaxDimension || image.Height > MaxDimension)
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(MaxDimension, MaxDimension)
            }));
        }

        await using var outputStream = new MemoryStream();
        var quality = 82;
        while (true)
        {
            outputStream.SetLength(0);
            await image.SaveAsWebpAsync(outputStream, new WebpEncoder { Quality = quality }, cancellationToken);
            if (outputStream.Length <= TargetFileSizeBytes || quality <= 50)
            {
                break;
            }

            quality -= 10;
        }

        outputStream.Position = 0;
        await blobClient.UploadAsync(outputStream, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = "image/webp" }
        }, cancellationToken);

        return blobClient.Uri.ToString();
    }
}
