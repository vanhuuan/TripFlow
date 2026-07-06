using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace backend.Services;

public interface IFileStorageService
{
    bool IsAllowedImage(IFormFile file);
    Task<string> SaveImageAsync(IFormFile file, CancellationToken cancellationToken);
}

public sealed class BlobStorageOptions
{
    public const string SectionName = "BlobStorage";

    public string? ConnectionString { get; set; }
    public string ContainerName { get; set; } = "tripflow-images";
}

public class AzureBlobFileStorageService : IFileStorageService
{
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

    public async Task<string> SaveImageAsync(IFormFile file, CancellationToken cancellationToken)
    {
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var blobName = $"{Guid.NewGuid():N}{extension}";
        var blobClient = containerClient.GetBlobClient(blobName);

        await using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
        }, cancellationToken);

        return blobClient.Uri.ToString();
    }
}
