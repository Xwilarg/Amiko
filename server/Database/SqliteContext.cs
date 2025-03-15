using Amiko.Models;
using Amiko.Server.Models;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Amiko.Server.Database;

public class ContextInterpreter
{
    private SqliteContext _ctx;
    private static bool _firstInit = true; // TODO: ugh

    private ContextInterpreter(SqliteContext ctx)
    {
        _ctx = ctx;

        if (!_firstInit) return;
        _firstInit = false;

        // Load/Update db from config
        if (!File.Exists("config.json"))
        {
            throw new InvalidOperationException();
        }
        var servs = JsonSerializer.Deserialize<Config>(File.ReadAllText("config.json"), new JsonSerializerOptions()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }).Servers;
        foreach (var s in servs)
        {
            if (!_ctx.Servers.Any(x => x.Name == s.Name))
            {
                AddServer(s.Name);
            }
            foreach (var c in s.Channels)
            {
                var server = _ctx.Servers.Include(s => s.Channels).First(x => x.Name == s.Name);
                if (!server.Channels.Any(x => x.Name == c.Name))
                {
                    AddChannel(server.Id, c.Name);
                }
            }
        }
    }

    public static ContextInterpreter Get(SqliteContext ctx)
    {
        return new(ctx);
    }

    public int AddServer(string name)
    {
        var serv = new ServerContext() { Name = name };
        _ctx.Servers.Add(serv);
        _ctx.SaveChanges();

        return serv.Id;
    }

    public int AddChannel(int servId, string name)
    {
        var serv = _ctx.Servers.FirstOrDefault(x => x.Id == servId);
        if (serv == null) throw new InvalidOperationException("Server not found");

        var chan = new ChannelContext() { Name = name };
        serv.Channels.Add(chan);
        _ctx.SaveChanges();

        return chan.Id;
    }

    public void AddMessage(int servId, int chanId, MessageContext msg)
    {
        var serv = _ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).FirstOrDefault(x => x.Id == servId);
        if (serv == null) throw new InvalidOperationException("Server not found");

        var chan = serv.Channels.FirstOrDefault(x => x.Id == chanId);
        if (chan == null) throw new InvalidOperationException("Channel not found");

        chan.Messages.Add(msg);
        _ctx.SaveChanges();
    }

    public ServerInfo[] GetStartingInfo(int maxMsgCount)
    {
        var data = _ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).Select(s => new ServerInfo()
        {
            Type = MessageType.ServerInfo,
            Id = s.Id,
            Name = s.Name,
            Channels = s.Channels.Select(c => new ChannelInfo()
            {
                Id = c.Id,
                Name = c.Name,
                Messages = c.Messages.Take(maxMsgCount).Select(m => new Message()
                {
                    Author = m.AuthorId,
                    Content = m.Message,
                    SentAt = new()
                    {
                        Seconds = (long)(m.CreationTime.ToUniversalTime() - DateTime.UnixEpoch).TotalSeconds,
                        Nanos = (m.CreationTime.ToUniversalTime() - DateTime.UnixEpoch).Nanoseconds
                    },
                    Id = m.Id
                }).ToArray()
            }).ToArray()
        }).ToArray();
        foreach (var s in data)
        {
            foreach (var c in s.Channels)
            {
                c.Messages = c.Messages.OrderBy(x => x.Id).ToArray();
            }
        }
        return data;
    }
}

public class SqliteContext : DbContext
{
    public DbSet<ServerContext> Servers { set; get; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=Sqlite.db");
}

public class ServerContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public string Name { set; get; }
    public List<ChannelContext> Channels { set; get; } = [];
}

public class ChannelContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public string Name { set; get; }
    public List<MessageContext> Messages { set; get; } = [];
}

public class MessageContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public DateTime CreationTime { set; get; }

    public string Message { set; get; }
    public string AuthorId { set; get; }
}
