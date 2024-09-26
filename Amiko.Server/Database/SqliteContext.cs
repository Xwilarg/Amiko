using Amiko.Common;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Threading.Channels;

namespace Amiko.Server.Database;

public class ContextInterpreter
{
    private SqliteContext _ctx;

    private ContextInterpreter(SqliteContext ctx)
    {
        _ctx = ctx;
    }

    public static ContextInterpreter Get(SqliteContext ctx)
    {
        return new(ctx);
    }

    public void AddMessage(MessageContext ctx)
    {
        if (!_ctx.Channels.Any())
        {
            _ctx.Channels.Add(new()
            {
                Id = Guid.NewGuid(),
                Name = "Default"
            });
        }
        _ctx.Channels.First().Messages.Add(ctx);
        _ctx.SaveChanges();
    }

    public IEnumerable<Message> AllMessages => _ctx.Channels.First().Messages.Select(x => new Message()
    {
        Name = x.Username,
        Content = x.Message
    });
}

public class SqliteContext : DbContext
{
    public DbSet<ChannelContext> Channels { set; get; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=Sqlite.db");
}

public class ChannelContext
{
    [Key] public Guid Id { set; get; }

    public string Name { set; get; }
    public List<MessageContext> Messages { set; get; } = new();
}

public class MessageContext
{
    [Key] public Guid Id { set; get; }

    public DateTime CreationTime { set; get; }

    public string Message { set; get; }
    public string Username { set; get; }
}
