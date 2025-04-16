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
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Color = table.Column<int>(type: "INTEGER", nullable: false),
                    Character = table.Column<string>(type: "TEXT", nullable: false),
                    AllowedUsers = table.Column<string>(type: "TEXT", nullable: true),
                    IsEphemeral = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowsGuest = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Servers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    Password = table.Column<string>(type: "TEXT", nullable: true),
                    DependsOf = table.Column<int>(type: "INTEGER", nullable: true),
                    Prefix = table.Column<string>(type: "TEXT", nullable: true),
                    Webhook = table.Column<string>(type: "TEXT", nullable: true),
                    Color = table.Column<int>(type: "INTEGER", nullable: false),
                    Character = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChannelContext",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
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
                name: "ChannelSeen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServId = table.Column<int>(type: "INTEGER", nullable: false),
                    ChanId = table.Column<int>(type: "INTEGER", nullable: false),
                    LastSeen = table.Column<long>(type: "INTEGER", nullable: false),
                    UserContextId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChannelSeen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChannelSeen_Users_UserContextId",
                        column: x => x.UserContextId,
                        principalTable: "Users",
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
                    Authors = table.Column<string>(type: "TEXT", nullable: false),
                    Reactions = table.Column<string>(type: "TEXT", nullable: false),
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

            migrationBuilder.CreateTable(
                name: "AttachmentContext",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Data = table.Column<byte[]>(type: "BLOB", nullable: false),
                    Filename = table.Column<string>(type: "TEXT", nullable: false),
                    Mimetype = table.Column<string>(type: "TEXT", nullable: false),
                    MessageContextId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttachmentContext", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttachmentContext_MessageContext_MessageContextId",
                        column: x => x.MessageContextId,
                        principalTable: "MessageContext",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttachmentContext_MessageContextId",
                table: "AttachmentContext",
                column: "MessageContextId");

            migrationBuilder.CreateIndex(
                name: "IX_ChannelContext_ServerContextId",
                table: "ChannelContext",
                column: "ServerContextId");

            migrationBuilder.CreateIndex(
                name: "IX_ChannelSeen_UserContextId",
                table: "ChannelSeen",
                column: "UserContextId");

            migrationBuilder.CreateIndex(
                name: "IX_MessageContext_ChannelContextId",
                table: "MessageContext",
                column: "ChannelContextId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AttachmentContext");

            migrationBuilder.DropTable(
                name: "ChannelSeen");

            migrationBuilder.DropTable(
                name: "MessageContext");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "ChannelContext");

            migrationBuilder.DropTable(
                name: "Servers");
        }
    }
}
