using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTripPlannerChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TripPlannerMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TripId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Content = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    Locale = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    ClientMessageId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReplyToMessageId = table.Column<Guid>(type: "uuid", nullable: true),
                    Provider = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripPlannerMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripPlannerMessages_Trips_TripId",
                        column: x => x.TripId,
                        principalTable: "Trips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TripPlanProposals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TripId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssistantMessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    BasePlanHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ProposedPlanJson = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AppliedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripPlanProposals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripPlanProposals_TripPlannerMessages_AssistantMessageId",
                        column: x => x.AssistantMessageId,
                        principalTable: "TripPlannerMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TripPlanProposals_Trips_TripId",
                        column: x => x.TripId,
                        principalTable: "Trips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TripPlannerMessages_ReplyToMessageId",
                table: "TripPlannerMessages",
                column: "ReplyToMessageId",
                unique: true,
                filter: "\"ReplyToMessageId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TripPlannerMessages_TripId_ClientMessageId",
                table: "TripPlannerMessages",
                columns: new[] { "TripId", "ClientMessageId" },
                unique: true,
                filter: "\"ClientMessageId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TripPlannerMessages_TripId_CreatedAt",
                table: "TripPlannerMessages",
                columns: new[] { "TripId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TripPlanProposals_AssistantMessageId",
                table: "TripPlanProposals",
                column: "AssistantMessageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TripPlanProposals_TripId_Status",
                table: "TripPlanProposals",
                columns: new[] { "TripId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TripPlanProposals");

            migrationBuilder.DropTable(
                name: "TripPlannerMessages");
        }
    }
}
