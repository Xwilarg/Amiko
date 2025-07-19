using Microsoft.EntityFrameworkCore;

namespace Amiko.Server.Database.Context;

public class SqliteContext : DbContext
{
    public DbSet<ServerContext> Servers { set; get; }
    public DbSet<UserContext> Users { set; get; }
    public DbSet<InvitationContext> Invitations { set; get; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=Sqlite.db");
}
