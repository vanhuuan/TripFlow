using System.Text;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;

namespace backend.Services;

public enum BlogDocumentKind
{
    Draft,
    Published
}

public sealed class BlogBlobStorageOptions
{
    public const string SectionName = "BlogBlobStorage";

    public string ContainerName { get; set; } = "tripflow-blogs";
}

public interface IBlogStorageService
{
    Task<string> SaveAsync(
        Guid blogId,
        BlogDocumentKind kind,
        string markdown,
        CancellationToken cancellationToken);

    Task<string?> ReadAsync(string blobName, CancellationToken cancellationToken);

    Task DeleteIfExistsAsync(string? blobName, CancellationToken cancellationToken);
}

public sealed class AzureBlobBlogStorageService(
    IOptions<BlobStorageOptions> storage,
    IOptions<BlogBlobStorageOptions> blogStorage) : IBlogStorageService
{
    private readonly BlobContainerClient containerClient = CreateClient(storage.Value, blogStorage.Value);

    public async Task<string> SaveAsync(
        Guid blogId,
        BlogDocumentKind kind,
        string markdown,
        CancellationToken cancellationToken)
    {
        await containerClient.CreateIfNotExistsAsync(
            PublicAccessType.None,
            cancellationToken: cancellationToken);

        var folder = kind == BlogDocumentKind.Draft ? "draft" : "published";
        var blobName = $"blogs/{blogId:N}/{folder}/{Guid.NewGuid():N}.md";

        await using var stream = new MemoryStream(
            Encoding.UTF8.GetBytes(markdown),
            writable: false);

        await containerClient.GetBlobClient(blobName).UploadAsync(
            stream,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = "text/markdown; charset=utf-8"
                }
            },
            cancellationToken);

        return blobName;
    }

    public async Task<string?> ReadAsync(
        string blobName,
        CancellationToken cancellationToken)
    {
        var blob = containerClient.GetBlobClient(blobName);
        if (!await blob.ExistsAsync(cancellationToken))
        {
            return null;
        }

        var content = await blob.DownloadContentAsync(cancellationToken);
        return content.Value.Content.ToString();
    }

    public async Task DeleteIfExistsAsync(
        string? blobName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(blobName))
        {
            return;
        }

        await containerClient
            .GetBlobClient(blobName)
            .DeleteIfExistsAsync(
                DeleteSnapshotsOption.IncludeSnapshots,
                cancellationToken: cancellationToken);
    }

    private static BlobContainerClient CreateClient(
        BlobStorageOptions storage,
        BlogBlobStorageOptions blogStorage)
    {
        if (string.IsNullOrWhiteSpace(storage.ConnectionString))
        {
            throw new InvalidOperationException(
                "Blob storage configuration is missing. Configure BlobStorage:ConnectionString.");
        }

        return new BlobServiceClient(storage.ConnectionString)
            .GetBlobContainerClient(blogStorage.ContainerName);
    }
}
