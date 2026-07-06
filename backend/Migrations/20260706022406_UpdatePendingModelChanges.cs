using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlaceImageUrl",
                table: "TripSteps");

            migrationBuilder.DropColumn(
                name: "TicketImageUrl",
                table: "TripSteps");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrlsJson",
                table: "TripSteps",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrlsJson",
                table: "TripSteps");

            migrationBuilder.AddColumn<string>(
                name: "PlaceImageUrl",
                table: "TripSteps",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TicketImageUrl",
                table: "TripSteps",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);
        }
    }
}
