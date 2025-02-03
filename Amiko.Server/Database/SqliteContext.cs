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

    public DataGroup<Message> AllMessages()
    {
        return new DataGroup<Message>()
        {
            Type = MessageType.MessageList,
            Data = !_ctx.Channels.Any() ? [] : _ctx.Channels.Include(x => x.Messages).First().Messages.Select(x =>
            {
                var d = x.CreationTime.ToUniversalTime() - DateTime.UnixEpoch;
                return new Message()
                {
                    Author = x.AuthorId,
                    Content = x.Message,
                    SentAt = new()
                    {
                        Seconds = (long)Math.Floor(d.TotalSeconds),
                        Nanos = d.Nanoseconds
                    }
                };
            }).ToArray()
        };
    }
}

public class SqliteContext : DbContext
{
    public DbSet<ChannelContext> Channels { set; get; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=Sqlite.db");
}

public class ChannelContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public string Name { set; get; }
    public List<MessageContext> Messages { set; get; }
}

public class MessageContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public DateTime CreationTime { set; get; }

    public string Message { set; get; }
    public string AuthorId { set; get; }
}
