using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Amiko.Server.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Servers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Servers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChannelContext",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    ServerContextId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChannelContext", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChannelContext_Servers_ServerContextId",
                        column: x => x.ServerContextId,
                        principalTable: "Servers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MessageContext",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CreationTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    AuthorId = table.Column<string>(type: "TEXT", nullable: false),
                    ChannelContextId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageContext", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageContext_ChannelContext_ChannelContextId",
                        column: x => x.ChannelContextId,
                        principalTable: "ChannelContext",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChannelContext_ServerContextId",
                table: "ChannelContext",
                column: "ServerContextId");

            migrationBuilder.CreateIndex(
                name: "IX_MessageContext_ChannelContextId",
                table: "MessageContext",
                column: "ChannelContextId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MessageContext");

            migrationBuilder.DropTable(
                name: "ChannelContext");

            migrationBuilder.DropTable(
                name: "Servers");
        }
    }
}
