using Amiko.Models;
using Amiko.Server.Models;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
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
        var config = JsonSerializer.Deserialize<Config>(File.ReadAllText("config.json"), new JsonSerializerOptions()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        foreach (var s in config.Servers)
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
        foreach (var u in config.Users)
        {
            if (!_ctx.Users.Any(x => x.Id == u.Id))
            {
                var color = u.Color ?? new() { R = 54, G = 54, B = 54 };
                _ctx.Users.Add(new()
                {
                    Id = u.Id,
                    Username = u.Username,
                    Password = u.Password,
                    DependsOf = u.DependsOf,
                    Prefix = u.Prefix,
                    Color = (color.R << 16) | (color.G << 8) | color.B,
                    Character = u.Character ?? u.Username[0].ToString()
                });
                _ctx.SaveChanges();
            }
            else
            {
                var currUser = _ctx.Users.First(x => x.Id == u.Id);
                if (u.Color != null) currUser.Color = (u.Color.R << 16) | (u.Color.G << 8) | u.Color.B;
                if (u.Character != null) currUser.Character = u.Character;
                _ctx.SaveChanges();
            }
        }
    }

    public static ContextInterpreter Get(SqliteContext ctx)
    {
        return new(ctx);
    }

    /// <summary>
    /// Does the identity given (who the user pretend to be) allowed by current claim
    /// This mean targetted account is either us or an account that depends on us
    /// </summary>
    public bool DoesUserFillClaim(int rawId, int identity)
    {
        if (rawId == identity) // User is claim
            return true;

        var rawTarget = _ctx.Users.FirstOrDefault(x => x.Id == rawId);
        var identityTarget = _ctx.Users.FirstOrDefault(x => x.Id == identity);

        if (rawTarget == null || identityTarget == null)
            return false; // User doesn't exists

        // Check dependencies
        return identityTarget.DependsOf == rawId || rawTarget.DependsOf == identity;
    }

    /// <summary>
    /// Does the user given on parameter have access to a server
    /// </summary>
    private bool CanAccessServer(int servId, int userId)
    {
        var serv = _ctx.Servers.First(x => x.Id == servId);

        return serv.AllowedUsers == null || serv.AllowedUsers.Contains(userId);
    }

    /// <summary>
    /// See if prefix given in parameter match a user
    /// </summary>
    public IEnumerable<UserContext> GetUsersFromPrefix(string prefix)
    {
        return _ctx.Users.Where(x => x.Prefix == prefix);
    }

    public UserContext? TryGetUserFromId(int id)
    {
        return _ctx.Users.FirstOrDefault(x => x.Id == id);
    }

    public UserContext? TryGetUserFromPassword(string password, string salt)
    {
        var saltBytes = Encoding.ASCII.GetBytes(salt);
        var hash = KeyDerivation.Pbkdf2(password, saltBytes, KeyDerivationPrf.HMACSHA512, 210000, 256 / 8);

        var computed = Convert.ToHexString(hash).ToLower();

        return _ctx.Users.FirstOrDefault(x => x.Password == computed);
    }

    public ServerContext? GetServer(int servId, int claimId)
    {
        var serv = _ctx.Servers.First(x => x.Id == servId);
        return CanAccessServer(serv.Id, claimId) ? serv : null;
    }

    public ChannelContext? GetChannel(int servId, int chanId, int claimId)
    {

        var serv = _ctx.Servers.Include(s => s.Channels).First(x => x.Id == servId);
        if (!CanAccessServer(serv.Id, claimId)) return null;
        return serv.Channels.First(x => x.Id == chanId);
    }

    public bool UpdateLastSeen(int servId, int chanId, int claimId, long now)
    {
        if (!CanAccessServer(servId, claimId)) return false;

        var u = _ctx.Users.Include(c => c.LastSeens).First(x => x.Id == claimId);
        var seen = u.LastSeens.FirstOrDefault(x => x.ServId == servId && x.ChanId == chanId);
        if (seen == null)
        {
            u.LastSeens.Add(new() { ServId = servId, ChanId = chanId, LastSeen = now });
        }
        else
        {
            seen.LastSeen = now;
        }
        _ctx.SaveChanges();
        return true;
    }


    private int AddServer(string name)
    {
        var serv = new ServerContext() { Name = name };
        _ctx.Servers.Add(serv);
        _ctx.SaveChanges();

        return serv.Id;
    }

    private int AddChannel(int servId, string name)
    {
        var serv = _ctx.Servers.FirstOrDefault(x => x.Id == servId);
        if (serv == null) throw new InvalidOperationException("Server not found");

        var chan = new ChannelContext() { Name = name };
        serv.Channels.Add(chan);
        _ctx.SaveChanges();

        return chan.Id;
    }

    public void AddMessage(int servId, int chanId, MessageContext msg) // TODO: Check writing perms
    {
        var serv = _ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).FirstOrDefault(x => x.Id == servId);
        if (serv == null) throw new InvalidOperationException("Server not found");

        var chan = serv.Channels.FirstOrDefault(x => x.Id == chanId);
        if (chan == null) throw new InvalidOperationException("Channel not found");

        chan.Messages.Add(msg);
        _ctx.SaveChanges();
    }

    public Message[] GetMessages(int servId, int chanId, int msgCount)
    {
        var msgs =
            _ctx.Servers
                .Include(s => s.Channels)
                .ThenInclude(c => c.Messages)
                .First(x => x.Id == servId).Channels
                .First(x => x.Id == chanId).Messages
                .TakeLast(msgCount)
                .Select(m => new Message()
                {
                    Author = m.AuthorId,
                    Content = m.Message,
                    SentAt = (long)(m.CreationTime.ToUniversalTime() - DateTime.UnixEpoch).TotalSeconds,
                    Id = m.Id
                });
        return msgs.OrderBy(x => x.Id).ToArray();
    }

    public ServerInfo[] GetStartingServerInfo(int maxMsgCount, int claimId)
    {
        var user = _ctx.Users.Include(u => u.LastSeens).First(x => x.Id == claimId);
        var data = _ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).AsEnumerable().Select(s => new ServerInfo()
        {
            Type = MessageType.ServerInfo,
            Id = s.Id,
            Name = s.Name,
            Channels = s.Channels.Select(c => new ChannelInfo()
            {
                Id = c.Id,
                Name = c.Name,
                Messages = GetMessages(s.Id, c.Id, maxMsgCount), // We will feel msgs right after (because OrderBy make a runtime exception)
                LastSeen = user.LastSeens.FirstOrDefault(x => x.ServId == s.Id && x.ChanId == c.Id)?.LastSeen ?? 0
            }).ToArray()
        }).ToArray();
        return data;
    }

    public UserInfo[] GetStartingUserInfo(int rawId)
    {
        var data = _ctx.Users.Select(u => new UserInfo()
        {
            Type = MessageType.UserInfo,
            Id = u.Id,
            Username = u.Username,
            Color = new Color()
            {
                R = (byte)((u.Color >> 16) & 0xff), 
                G = (byte)((u.Color >> 8) & 0xff), 
                B = (byte)((u.Color >> 0) & 0xff)
            },
            Character = u.Character,

            IsMe = u.Id == rawId,
            IsMyGroup = u.Id == rawId || u.DependsOf == rawId
        }).ToArray();
        return data;
    }
}

public class SqliteContext : DbContext
{
    public DbSet<ServerContext> Servers { set; get; }
    public DbSet<UserContext> Users { set; get; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=Sqlite.db");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.Entity<ChannelSeen>()
			.HasKey(nameof(ChannelSeen.ServId), nameof(ChannelSeen.ChanId));
	}
}

public class UserContext
{
    [Key] public int Id { set; get; }
    public string Username { set; get; }
    public string? Password { set; get; }
    public int? DependsOf { set; get; }
    public int Color { set; get; }
    public string Character { set; get; }
    public string? Prefix { set; get; }

    public List<ChannelSeen> LastSeens { set; get; }= new();
}

public class ChannelSeen
{
    public int ServId { set; get; }
    public int ChanId { set; get; }
    public long LastSeen { set; get; }
}

public class ServerContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public string Name { set; get; }
    public List<ChannelContext> Channels { set; get; } = [];
    public List<int>? AllowedUsers { set; get; } = null;
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
    public int AuthorId { set; get; }
}
