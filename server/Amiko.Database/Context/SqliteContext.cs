using Microsoft.EntityFrameworkCore;

namespace Amiko.Database.Context;

public class SqliteContext : DbContext
{
    internal DbSet<ServerContext> Servers { set; get; }
    internal DbSet<UserContext> Users { set; get; }
    internal DbSet<InvitationContext> Invitations { set; get; }
    internal DbSet<AllowedUsersContext> AllowUsers { set; get; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite($"Data Source={RuntimePath.GetPath()}Sqlite.db");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AllowedUsersContext>().HasKey(x => new
        {
            x.ServerId,
            x.UserId
        });
    }
}
