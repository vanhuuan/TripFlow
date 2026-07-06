using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTripSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(                                                                               
                name: "IsPublicShared",                                                                                     
                table: "Trips",                                                                                             
                type: "boolean",                                                                                            
                nullable: false,                                                                                            
                defaultValue: false); 

            migrationBuilder.AddColumn<string>(
                name: "PublicShareToken",
                table: "Trips",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateIndex(
               name: "IX_Public_Share_Token",
               table: "Trips",
               column: "PublicShareToken",
               unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
