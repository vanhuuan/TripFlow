using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace backend.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260713090000_MoveBlogContentToBlobStorage")]
public partial class MoveBlogContentToBlobStorage : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DELETE FROM \"TripBlogs\";");
        migrationBuilder.DropColumn(name: "DraftContentJson", table: "TripBlogs");
        migrationBuilder.DropColumn(name: "PublishedContentJson", table: "TripBlogs");
        migrationBuilder.AddColumn<string>(name: "DraftBlobName", table: "TripBlogs", type: "character varying(512)", maxLength: 512, nullable: false);
        migrationBuilder.AddColumn<string>(name: "PublishedBlobName", table: "TripBlogs", type: "character varying(512)", maxLength: 512, nullable: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "DraftBlobName", table: "TripBlogs");
        migrationBuilder.DropColumn(name: "PublishedBlobName", table: "TripBlogs");
        migrationBuilder.AddColumn<string>(name: "DraftContentJson", table: "TripBlogs", type: "text", nullable: false, defaultValue: "{}");
        migrationBuilder.AddColumn<string>(name: "PublishedContentJson", table: "TripBlogs", type: "text", nullable: true);
    }
}