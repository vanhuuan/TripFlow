using backend.Controllers;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace backend.Tests;

public class TripPlannerControllerTests
{
    [Fact]
    public async Task AssistantReplyWithoutProposalDoesNotChangeTrip()
    {
        await using var fixture = await PlannerFixture.Create();
        fixture.Generation.Result = new PlannerGenerationResult("Happy to help.", null);

        var response = await fixture.Controller.CreateMessage(
            fixture.TripId,
            new CreatePlannerMessageRequest(Guid.NewGuid(), "What should I pack?", "en"),
            CancellationToken.None);

        var turn = OkValue(response);
        Assert.Null(turn.AssistantMessage.Proposal);
        Assert.Equal(2, await fixture.Db.TripPlannerMessages.CountAsync());
        Assert.Empty(await fixture.Db.TripPlanProposals.ToListAsync());
        Assert.Equal("Original trip", (await fixture.Db.Trips.FindAsync(fixture.TripId))!.Title);
    }

    [Fact]
    public async Task NewProposalBuildsOnPendingWorkingPlan()
    {
        await using var fixture = await PlannerFixture.Create();
        var savedPlan = PlannerPlanUtilities.FromTrip(await fixture.LoadTrip());
        var firstDraft = savedPlan with { Title = "First unsaved title" };
        fixture.Generation.Result = new PlannerGenerationResult("First draft.", firstDraft);
        await fixture.Controller.CreateMessage(fixture.TripId, new CreatePlannerMessageRequest(Guid.NewGuid(), "Rename the trip", "en"), CancellationToken.None);

        fixture.Generation.ResultFactory = currentPlan => new PlannerGenerationResult(
            "Second draft.",
            currentPlan with { Destination = "Hoi An" });
        var secondTurn = OkValue(await fixture.Controller.CreateMessage(
            fixture.TripId,
            new CreatePlannerMessageRequest(Guid.NewGuid(), "Change the destination too", "en"),
            CancellationToken.None));

        Assert.Equal("First unsaved title", secondTurn.AssistantMessage.Proposal!.Plan.Title);
        Assert.Equal("Hoi An", secondTurn.AssistantMessage.Proposal.Plan.Destination);
        Assert.Equal([PlanProposalStatus.Superseded, PlanProposalStatus.Pending],
            await fixture.Db.TripPlanProposals.OrderBy(proposal => proposal.CreatedAt).Select(proposal => proposal.Status).ToListAsync());
        Assert.Equal("Original trip", (await fixture.Db.Trips.FindAsync(fixture.TripId))!.Title);
    }

    [Fact]
    public async Task AssistantOnlyReplyPreservesPendingWorkingPlan()
    {
        await using var fixture = await PlannerFixture.Create();
        var draft = (PlannerPlanUtilities.FromTrip(await fixture.LoadTrip())) with { Title = "Unsaved title" };
        fixture.Generation.Result = new PlannerGenerationResult("Draft ready.", draft);
        await fixture.Controller.CreateMessage(fixture.TripId, new CreatePlannerMessageRequest(Guid.NewGuid(), "Rename it", "en"), CancellationToken.None);

        fixture.Generation.Result = new PlannerGenerationResult("The draft has two steps.", null);
        await fixture.Controller.CreateMessage(fixture.TripId, new CreatePlannerMessageRequest(Guid.NewGuid(), "How many steps?", "en"), CancellationToken.None);

        var proposal = await fixture.Db.TripPlanProposals.SingleAsync();
        Assert.Equal(PlanProposalStatus.Pending, proposal.Status);
        Assert.Equal("Unsaved title", fixture.Generation.LastCurrentPlan!.Title);
    }

    [Fact]
    public async Task FirstHistoryPageIncludesOlderPendingDraft()
    {
        await using var fixture = await PlannerFixture.Create();
        var draft = (PlannerPlanUtilities.FromTrip(await fixture.LoadTrip())) with { Title = "Persistent draft" };
        fixture.Generation.Result = new PlannerGenerationResult("Draft ready.", draft);
        var draftTurn = OkValue(await fixture.Controller.CreateMessage(
            fixture.TripId,
            new CreatePlannerMessageRequest(Guid.NewGuid(), "Prepare a draft", "en"),
            CancellationToken.None));

        fixture.Generation.Result = new PlannerGenerationResult("No plan change.", null);
        for (var index = 0; index < 2; index++)
            await fixture.Controller.CreateMessage(fixture.TripId, new CreatePlannerMessageRequest(Guid.NewGuid(), $"Question {index}", "en"), CancellationToken.None);

        var page = OkValue(await fixture.Controller.GetMessages(fixture.TripId, null, 2, CancellationToken.None));

        Assert.Contains(page.Messages, message => message.Id == draftTurn.AssistantMessage.Id && message.Proposal?.Status == PlanProposalStatus.Pending);
        Assert.NotNull(page.NextBefore);
    }

    [Fact]
    public async Task NewTurnDropsStaleDraftAndStartsFromLivePlan()
    {
        await using var fixture = await PlannerFixture.Create();
        var draft = (PlannerPlanUtilities.FromTrip(await fixture.LoadTrip())) with { Title = "Old draft" };
        fixture.Generation.Result = new PlannerGenerationResult("Draft ready.", draft);
        await fixture.Controller.CreateMessage(fixture.TripId, new CreatePlannerMessageRequest(Guid.NewGuid(), "Draft this", "en"), CancellationToken.None);

        var trip = await fixture.Db.Trips.FindAsync(fixture.TripId);
        trip!.Title = "Changed outside planner";
        await fixture.Db.SaveChangesAsync();
        fixture.Generation.ResultFactory = currentPlan => new PlannerGenerationResult("Revised draft.", currentPlan with { Destination = "Da Lat" });

        var turn = OkValue(await fixture.Controller.CreateMessage(fixture.TripId, new CreatePlannerMessageRequest(Guid.NewGuid(), "Revise it", "en"), CancellationToken.None));

        Assert.Equal("Changed outside planner", turn.AssistantMessage.Proposal!.Plan.Title);
        Assert.Equal([PlanProposalStatus.Stale, PlanProposalStatus.Pending],
            await fixture.Db.TripPlanProposals.OrderBy(proposal => proposal.CreatedAt).Select(proposal => proposal.Status).ToListAsync());
    }

    [Fact]
    public async Task ApplyingProposalAtomicallyUpdatesCreatesDeletesAndReorders()
    {
        await using var fixture = await PlannerFixture.Create();
        var existing = await fixture.Db.TripSteps.OrderBy(step => step.OrderIndex).ToListAsync();
        fixture.Generation.Result = new PlannerGenerationResult("I prepared two changes.", new ProposedTripPlanResponse(
            "Updated trip", "Da Nang", "A calmer plan", new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 4), "VND",
            [
                new ProposedTripStepResponse("new-lunch", null, "Lunch", null, TripStepType.Restaurant, TripStepStatus.Todo, null, 300000, null, null, [], [fixture.MemberId]),
                new ProposedTripStepResponse(existing[0].Id.ToString("N"), existing[0].Id, "Museum updated", "Tickets confirmed", TripStepType.Activity, TripStepStatus.Done, existing[0].ScheduledAt, 150000, null, null, [], [fixture.MemberId])
            ]));

        var turn = OkValue(await fixture.Controller.CreateMessage(fixture.TripId, new CreatePlannerMessageRequest(Guid.NewGuid(), "Update the plan", "en"), CancellationToken.None));
        var applied = await fixture.Controller.ApplyProposal(fixture.TripId, turn.AssistantMessage.Proposal!.Id, CancellationToken.None);

        var updatedTrip = OkValue(applied);
        Assert.Equal("Updated trip", updatedTrip.Title);
        Assert.Equal(2, updatedTrip.Steps.Count);
        Assert.Equal("Lunch", updatedTrip.Steps[0].Title);
        Assert.Equal("Museum updated", updatedTrip.Steps[1].Title);
        Assert.Equal(TripStepStatus.Done, updatedTrip.Steps[1].Status);
        Assert.DoesNotContain(updatedTrip.Steps, step => step.Id == existing[1].Id);
        Assert.Equal(PlanProposalStatus.Applied, (await fixture.Db.TripPlanProposals.SingleAsync()).Status);
    }

    [Fact]
    public async Task ChangedItineraryMakesPendingProposalStale()
    {
        await using var fixture = await PlannerFixture.Create();
        fixture.Generation.Result = new PlannerGenerationResult("Here is a proposal.", PlannerPlanUtilities.FromTrip(await fixture.LoadTrip()));
        var turn = OkValue(await fixture.Controller.CreateMessage(fixture.TripId, new CreatePlannerMessageRequest(Guid.NewGuid(), "Keep this plan", "en"), CancellationToken.None));

        var step = await fixture.Db.TripSteps.OrderBy(item => item.OrderIndex).FirstAsync();
        step.Title = "Changed elsewhere";
        await fixture.Db.SaveChangesAsync();

        var result = await fixture.Controller.ApplyProposal(fixture.TripId, turn.AssistantMessage.Proposal!.Id, CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(PlanProposalStatus.Stale, (await fixture.Db.TripPlanProposals.SingleAsync()).Status);
    }

    [Fact]
    public async Task ClientMessageIdReturnsTheSamePersistedTurn()
    {
        await using var fixture = await PlannerFixture.Create();
        fixture.Generation.Result = new PlannerGenerationResult("One answer.", null);
        var clientMessageId = Guid.NewGuid();
        var request = new CreatePlannerMessageRequest(clientMessageId, "Hello", "en");

        var first = OkValue(await fixture.Controller.CreateMessage(fixture.TripId, request, CancellationToken.None));
        var second = OkValue(await fixture.Controller.CreateMessage(fixture.TripId, request, CancellationToken.None));

        Assert.Equal(first.UserMessage.Id, second.UserMessage.Id);
        Assert.Equal(first.AssistantMessage.Id, second.AssistantMessage.Id);
        Assert.Equal(2, await fixture.Db.TripPlannerMessages.CountAsync());
        Assert.Equal(1, fixture.Generation.CallCount);
    }

    [Fact]
    public async Task OtherUsersCannotReadPlannerHistory()
    {
        await using var fixture = await PlannerFixture.Create();
        fixture.CurrentUser.UserIdValue = Guid.NewGuid();

        var result = await fixture.Controller.GetMessages(fixture.TripId, null, 50, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    private static T OkValue<T>(ActionResult<T> result) =>
        Assert.IsType<T>(Assert.IsType<OkObjectResult>(result.Result).Value);

    private sealed class PlannerFixture : IAsyncDisposable
    {
        public AppDbContext Db { get; }
        public FakeCurrentUser CurrentUser { get; }
        public FakeGenerationService Generation { get; }
        public TripPlannerController Controller { get; }
        public Guid TripId { get; }
        public Guid MemberId { get; }

        private PlannerFixture(AppDbContext db, FakeCurrentUser currentUser, FakeGenerationService generation, TripPlannerController controller, Guid tripId, Guid memberId)
        {
            Db = db; CurrentUser = currentUser; Generation = generation; Controller = controller; TripId = tripId; MemberId = memberId;
        }

        public static async Task<PlannerFixture> Create()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            var db = new AppDbContext(options);

            var userId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var memberId = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;
            var user = new User { Id = userId, Email = "owner@example.com", NormalizedEmail = "OWNER@EXAMPLE.COM", DisplayName = "Owner", PasswordHash = "hash", CreatedAt = now };
            var trip = new Trip
            {
                Id = tripId, UserId = userId, User = user, Title = "Original trip", Destination = "Hue", CurrencyCode = "USD",
                Status = TripStatus.Draft, CreatedAt = now, UpdatedAt = now
            };
            var member = new TripMember { Id = memberId, TripId = tripId, Trip = trip, Name = "Alex", CreatedAt = now };
            trip.Members.Add(member);
            var museum = new TripStep { Id = Guid.NewGuid(), TripId = tripId, Trip = trip, Title = "Museum", Type = TripStepType.Activity, Status = TripStepStatus.Todo, OrderIndex = 0, CreatedAt = now, UpdatedAt = now };
            museum.Participants.Add(new TripStepParticipant { TripStepId = museum.Id, TripStep = museum, TripMemberId = memberId, TripMember = member });
            trip.Steps.Add(museum);
            trip.Steps.Add(new TripStep { Id = Guid.NewGuid(), TripId = tripId, Trip = trip, Title = "Old hotel", Type = TripStepType.Hotel, Status = TripStepStatus.Todo, OrderIndex = 1, CreatedAt = now, UpdatedAt = now });
            db.Add(trip);
            await db.SaveChangesAsync();

            var currentUser = new FakeCurrentUser { UserIdValue = userId };
            var generation = new FakeGenerationService();
            var controller = new TripPlannerController(db, currentUser, generation, new FakeConfiguredModel(), NullLogger<TripPlannerController>.Instance);
            return new PlannerFixture(db, currentUser, generation, controller, tripId, memberId);
        }

        public Task<Trip> LoadTrip() => Db.Trips.Include(trip => trip.Members).Include(trip => trip.Steps).ThenInclude(step => step.Participants).SingleAsync(trip => trip.Id == TripId);

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
        }
    }

    private sealed class FakeCurrentUser : ICurrentUserService
    {
        public Guid? UserIdValue { get; set; }
        public Guid? UserId => UserIdValue;
    }

    private sealed class FakeConfiguredModel : IConfiguredBlogModel
    {
        public ConfiguredBlogModelDefinition Get() => new("OpenAI", "test-model");
    }

    private sealed class FakeGenerationService : ITripPlannerGenerationService
    {
        public PlannerGenerationResult Result { get; set; } = new("Hello", null);
        public Func<ProposedTripPlanResponse, PlannerGenerationResult>? ResultFactory { get; set; }
        public ProposedTripPlanResponse? LastCurrentPlan { get; private set; }
        public int CallCount { get; private set; }
        public Task<PlannerGenerationResult> GenerateAsync(Trip trip, ProposedTripPlanResponse currentPlan, IReadOnlyList<TripPlannerMessage> history, Guid userId, string locale, ConfiguredBlogModelDefinition model, CancellationToken cancellationToken)
        {
            CallCount++;
            LastCurrentPlan = currentPlan;
            return Task.FromResult(ResultFactory?.Invoke(currentPlan) ?? Result);
        }
    }
}
