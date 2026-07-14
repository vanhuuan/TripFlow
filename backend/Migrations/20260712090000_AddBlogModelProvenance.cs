using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace backend.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260712090000_AddBlogModelProvenance")]
public partial class AddBlogModelProvenance : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "GeneratedModel", table: "TripBlogs", type: "character varying(100)", maxLength: 100, nullable: true);
        migrationBuilder.AddColumn<string>(name: "GeneratedProvider", table: "TripBlogs", type: "character varying(32)", maxLength: 32, nullable: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "GeneratedModel", table: "TripBlogs"); migrationBuilder.DropColumn(name: "GeneratedProvider", table: "TripBlogs");
    }
}