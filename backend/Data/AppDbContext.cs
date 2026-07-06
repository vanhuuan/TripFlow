using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Trip> Trips => Set<Trip>();
    public DbSet<TripStep> TripSteps => Set<TripStep>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Email).HasMaxLength(256).IsRequired();
            entity.Property(user => user.NormalizedEmail).HasMaxLength(256).IsRequired();
            entity.HasIndex(user => user.NormalizedEmail).IsUnique();
            entity.Property(user => user.DisplayName).HasMaxLength(100).IsRequired();
            entity.Property(user => user.PasswordHash).IsRequired();
            entity.Property(user => user.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<Trip>(entity =>
        {
            entity.HasKey(trip => trip.Id);
            entity.Property(trip => trip.Title).HasMaxLength(150).IsRequired();
            entity.Property(trip => trip.Destination).HasMaxLength(150).IsRequired();
            entity.Property(trip => trip.Description).HasMaxLength(2000);
            entity.Property(trip => trip.CoverImageUrl).HasMaxLength(2048);
            entity.Property(trip => trip.PublicShareToken).HasMaxLength(128);
            entity.HasIndex(trip => trip.PublicShareToken).IsUnique();
            entity.Property(trip => trip.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(trip => trip.IsPublicShared).IsRequired();
            entity.Property(trip => trip.CreatedAt).IsRequired();
            entity.Property(trip => trip.UpdatedAt).IsRequired();
            entity.HasIndex(trip => trip.UserId);
            entity.HasOne(trip => trip.User).WithMany(user => user.Trips).HasForeignKey(trip => trip.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TripStep>(entity =>
        {
            entity.HasKey(step => step.Id);
            entity.Property(step => step.Title).HasMaxLength(150).IsRequired();
            entity.Property(step => step.Description).HasMaxLength(2000);
            entity.Property(step => step.Type).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(step => step.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(step => step.GoogleMapsUrl).HasMaxLength(2048);
            entity.Property(step => step.ExternalUrl).HasMaxLength(2048);
            entity.Property(step => step.ImageUrlsJson).HasMaxLength(8000);
            entity.Property(step => step.OrderIndex).IsRequired();
            entity.Property(step => step.CreatedAt).IsRequired();
            entity.Property(step => step.UpdatedAt).IsRequired();
            entity.HasIndex(step => step.TripId);
            entity.HasIndex(step => new { step.TripId, step.OrderIndex });
            entity.HasOne(step => step.Trip).WithMany(trip => trip.Steps).HasForeignKey(step => step.TripId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
