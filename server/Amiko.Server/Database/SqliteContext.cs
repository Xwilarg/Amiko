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

    private ContextInterpreter(SqliteContext ctx)
    {
        _ctx = ctx;
    }

    public static ContextInterpreter Get(SqliteContext ctx)
    {
        return new(ctx);
    }

    public void Init()
    {
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
                AddServer(s.Name, s.AllowedUsers, s.Color, s.Character);
            }
            else
            {
                var currServ = _ctx.Servers.First(x => x.Name == s.Name);
                currServ.AllowedUsers = s.AllowedUsers?.ToList();
                if (s.Color != null) currServ.Color = (s.Color.R << 16) | (s.Color.G << 8) | s.Color.B;
                if (s.Character != null) currServ.Character = s.Character;
                _ctx.SaveChanges();
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
                    Character = u.Character ?? u.Username[0].ToString(),
                    Webhook = u.Webhook
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

    /// <summary>
    /// Does the identity given (who the user pretend to be) allowed by current claim
    /// This mean targetted account is either us or an account that depends on us
    /// </summary>
    public bool DoesUserFillClaim(int claimId, int identity)
    {
        if (claimId == identity) // User is claim
            return true;

        var rawTarget = _ctx.Users.FirstOrDefault(x => x.Id == claimId);
        var identityTarget = _ctx.Users.FirstOrDefault(x => x.Id == identity);
        if (rawTarget == null || identityTarget == null)
            return false; // User doesn't exists

        // Check dependencies
        return identityTarget.DependsOf == claimId || rawTarget.DependsOf == identity;
    }

    /// <summary>
    /// Does the user given on parameter have access to a server
    /// </summary>
    public bool CanAccessServer(int servId, int userId)
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

    public MessageContext? GetMessage(int servId, int chanId, int msgId, int claimId)
    {
        var serv = _ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).ThenInclude(m => m.Attachments).First(x => x.Id == servId);
        if (!CanAccessServer(serv.Id, claimId)) return null;
        return serv.Channels.First(x => x.Id == chanId).Messages.First(x => x.Id == msgId);
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


    private int AddServer(string name, int[]? allowedUsers, Color? color, string? character)
    {
        color ??= new Color() { R = 54, G = 54, B = 54 };
        var serv = new ServerContext()
        {
            Name = name,
            AllowedUsers = allowedUsers?.ToList(),
            Color = (color.R << 16) | (color.G << 8) | color.B,
            Character = character ?? name[0].ToString()
        };
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

    public int AddMessage(int servId, int chanId, MessageContext msg) // TODO: Check writing perms
    {
        var serv = _ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).FirstOrDefault(x => x.Id == servId);
        if (serv == null) throw new InvalidOperationException("Server not found");

        var chan = serv.Channels.FirstOrDefault(x => x.Id == chanId);
        if (chan == null) throw new InvalidOperationException("Channel not found");

        chan.Messages.Add(msg);
        _ctx.SaveChanges();

        return msg.Id;
    }

    public IEnumerable<UserContext> GetAllWebhooks()
        => _ctx.Users.Where(x => x.Webhook != null);

    public int? TryAddAttachment(int servId, int chanId, int msgId, int claimId, string filename, string contentType, byte[] data)
    {
        var msg = GetMessage(servId, chanId, msgId, claimId);
        if (msg == null) return null;
        if (!msg.Authors.Any(x => DoesUserFillClaim(claimId, x))) return null;

        msg.Attachments.Add(new AttachmentContext()
        {
            Filename = filename,
            Mimetype = contentType,
            Data = data
        });

        _ctx.SaveChanges();
        return msg.Id;
    }

    public List<AttachmentContext> TryGetAttachment(int servId, int chanId, int msgId, int claimId)
    {
        var msg = GetMessage(servId, chanId, msgId, claimId);
        if (msg == null) return [];

        return msg.Attachments;
    }

    public Message[] GetMessages(int servId, int chanId, int msgCount)
    {
        var msgs =
            _ctx.Servers
                .Include(s => s.Channels)
                .ThenInclude(c => c.Messages)
                .ThenInclude(m => m.Attachments)
                .First(x => x.Id == servId).Channels
                .First(x => x.Id == chanId).Messages
                .TakeLast(msgCount)
                .Select(m => new Message()
                {
                    Authors = m.Authors,
                    Content = m.Message,
                    SentAt = (long)(m.CreationTime.ToUniversalTime() - DateTime.UnixEpoch).TotalSeconds,
                    Id = m.Id,
                    Attachments = m.Attachments.Select(a => new AttachmentInfo() {
                        Name = a.Filename,
                        Id = a.Id
                    }).ToArray()
                });
        return msgs.OrderBy(x => x.Id).ToArray();
    }

    public ServerInfo[] GetStartingServerInfo(int maxMsgCount, int claimId)
    {
        var user = _ctx.Users.Include(u => u.LastSeens).First(x => x.Id == claimId);
        var data = _ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).AsEnumerable().Where(x => CanAccessServer(x.Id, claimId)).Select(s => new ServerInfo()
        {
            Type = MessageType.ServerInfo,
            Id = s.Id,
            Name = s.Name,
            Color = new Color()
            {
                R = (byte)((s.Color >> 16) & 0xff), 
                G = (byte)((s.Color >> 8) & 0xff), 
                B = (byte)((s.Color >> 0) & 0xff)
            },
            Character = s.Character,
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
}

public class AttachmentContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }
    public byte[] Data { set; get; }
    public string Filename { set; get; }
    public string Mimetype { set; get; }
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

    public string? Webhook { set; get; }

    public List<ChannelSeen> LastSeens { set; get; } = [];
}

public class ChannelSeen
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public int ServId { set; get; }
    public int ChanId { set; get; }
    public long LastSeen { set; get; }
}

public class ServerContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public string Name { set; get; }
    public int Color { set; get; }
    public string Character { set; get; }
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
    public int[] Authors { set; get; }
    public List<AttachmentContext> Attachments { set; get; } = [];
}
