using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Trip> Trips => Set<Trip>();
    public DbSet<TripStep> TripSteps => Set<TripStep>();
    public DbSet<TripMember> TripMembers => Set<TripMember>();
    public DbSet<TripStepParticipant> TripStepParticipants => Set<TripStepParticipant>();
    public DbSet<TripBlog> TripBlogs => Set<TripBlog>();

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
            entity.Property(trip => trip.CurrencyCode).HasMaxLength(3).HasDefaultValue("USD").IsRequired();
            entity.Property(trip => trip.PublicShareToken).HasMaxLength(128);
            entity.HasIndex(trip => trip.PublicShareToken).IsUnique();
            entity.Property(trip => trip.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(trip => trip.IsPublicShared).IsRequired();
            entity.Property(trip => trip.CreatedAt).IsRequired();
            entity.Property(trip => trip.UpdatedAt).IsRequired();
            entity.HasIndex(trip => trip.UserId);
            entity.HasOne(trip => trip.User).WithMany(user => user.Trips).HasForeignKey(trip => trip.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TripMember>(entity =>
        {
            entity.HasKey(member => member.Id);
            entity.Property(member => member.Name).HasMaxLength(100).IsRequired();
            entity.Property(member => member.CreatedAt).IsRequired();
            entity.HasIndex(member => member.TripId);
            entity.HasOne(member => member.Trip).WithMany(trip => trip.Members).HasForeignKey(member => member.TripId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TripStep>(entity =>
        {
            entity.HasKey(step => step.Id);
            entity.Property(step => step.Title).HasMaxLength(150).IsRequired();
            entity.Property(step => step.Description).HasMaxLength(2000);
            entity.Property(step => step.Type).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(step => step.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(step => step.CostAmount).HasColumnType("numeric(12,2)");
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

        modelBuilder.Entity<TripStepParticipant>(entity =>
        {
            entity.HasKey(participant => new { participant.TripStepId, participant.TripMemberId });
            entity.HasIndex(participant => participant.TripMemberId);
            entity.HasOne(participant => participant.TripStep).WithMany(step => step.Participants).HasForeignKey(participant => participant.TripStepId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(participant => participant.TripMember).WithMany(member => member.StepParticipants).HasForeignKey(participant => participant.TripMemberId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TripBlog>(entity =>
        {
            entity.HasKey(blog => blog.Id);
            entity.Property(blog => blog.Locale).HasMaxLength(2).IsRequired();
            entity.Property(blog => blog.DraftBlobName).HasMaxLength(512).IsRequired();
            entity.Property(blog => blog.PublishedBlobName).HasMaxLength(512);
            entity.Property(blog => blog.PublicShareToken).HasMaxLength(128);
            entity.Property(blog => blog.GeneratedProvider).HasMaxLength(32);
            entity.Property(blog => blog.GeneratedModel).HasMaxLength(100);
            entity.HasIndex(blog => blog.TripId).IsUnique();
            entity.HasIndex(blog => blog.PublicShareToken).IsUnique();
            entity.Property(blog => blog.GeneratedAt).IsRequired();
            entity.Property(blog => blog.UpdatedAt).IsRequired();
            entity.HasOne(blog => blog.Trip).WithOne(trip => trip.Blog).HasForeignKey<TripBlog>(blog => blog.TripId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
