using Amiko.Common;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    public void AddMessage(MessageContext msh)
    {
        if (!_ctx.Channels.Any())
        {
            _ctx.Channels.Add(new()
            {
                Name = "Default",
                Messages = [
                    msh
                ]
            });
        }
        else
        {
            _ctx.Channels.First().Messages.Add(msh);
        }
        _ctx.SaveChanges();
    }

    public IEnumerable<Message> AllMessages => !_ctx.Channels.Any() ? [] : _ctx.Channels.First().Messages.Select(x => new Message()
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
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)] public int Id { set; get; }

    public string Name { set; get; }
    public List<MessageContext> Messages { set; get; } = new();
}

public class MessageContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)] public int Id { set; get; }

    public DateTime CreationTime { set; get; }

    public string Message { set; get; }
    public string Username { set; get; }
}
