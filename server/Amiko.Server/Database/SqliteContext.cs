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
                AddServer(s.Name, s.AllowedUsers, s.Color, s.Character, s.IsEphemeral ?? false, s.AllowsGuest ?? false);
            }
            else
            {
                var currServ = _ctx.Servers.First(x => x.Name == s.Name);
                currServ.AllowedUsers = s.AllowedUsers?.ToList();
                if (s.Color != null) currServ.Color = (s.Color.R << 16) | (s.Color.G << 8) | s.Color.B;
                if (s.Character != null) currServ.Character = s.Character;
                currServ.IsEphemeral = s.IsEphemeral ?? false;
                currServ.AllowsGuest = s.AllowsGuest ?? false;
                _ctx.SaveChanges();
            }
            foreach (var c in s.Channels)
            {
                var server = _ctx.Servers.Include(s => s.Channels).First(x => x.Name == s.Name);
                var channel = server.Channels.FirstOrDefault(x => x.Name == c.Name);
                if (channel == null)
                {
                    AddChannel(server.Id, c.Name, c.Description);
                }
                else
                {
                    channel.Description = c.Description;
                    _ctx.SaveChanges();
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
    public bool CanAccessServer(int servId, int? userId)
    {
        var serv = _ctx.Servers.First(x => x.Id == servId);

        if (userId != null) { // Authentificated user
            return serv.AllowedUsers == null || serv.AllowedUsers.Contains(userId.Value); // There is no whitelist or user is allowed
        }

        // Guest user
        return serv.AllowedUsers == null || serv.AllowsGuest;
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

    public MessageContext? GetMessage(int servId, int chanId, int msgId, int? claimId)
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


    private int AddServer(string name, int[]? allowedUsers, Color? color, string? character, bool isEphemeral, bool allowsGuest)
    {
        color ??= new Color() { R = 54, G = 54, B = 54 };
        var serv = new ServerContext()
        {
            Name = name,
            AllowedUsers = allowedUsers?.ToList(),
            Color = (color.R << 16) | (color.G << 8) | color.B,
            Character = character ?? name[0].ToString(),
            IsEphemeral = isEphemeral,
            AllowsGuest = allowsGuest
        };
        _ctx.Servers.Add(serv);
        _ctx.SaveChanges();

        return serv.Id;
    }

    private int AddChannel(int servId, string name, string? description)
    {
        var serv = _ctx.Servers.FirstOrDefault(x => x.Id == servId);
        if (serv == null) throw new InvalidOperationException("Server not found");

        var chan = new ChannelContext()
        {
            Name = name,
            Description = description
        };
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
        if (serv.IsEphemeral) {
            chan.Messages = chan.Messages.TakeLast(100).ToList(); // Ephemeral channels always keep 100 messages at most
        }
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

    public List<AttachmentContext> TryGetAttachment(int servId, int chanId, int msgId, int? claimId)
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

    public ServerInfo[] GetStartingServerInfo(int maxMsgCount, int? claimId)
    {
        var user = _ctx.Users.Include(u => u.LastSeens).FirstOrDefault(x => x.Id == claimId);
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
            IsEphemeral = s.IsEphemeral,
            AllowsGuest = s.AllowsGuest,
            Channels = s.Channels.Select(c => new ChannelInfo()
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Messages = GetMessages(s.Id, c.Id, maxMsgCount), // We will feel msgs right after (because OrderBy make a runtime exception)
                LastSeen = user == null ? 0 : (user.LastSeens.FirstOrDefault(x => x.ServId == s.Id && x.ChanId == c.Id)?.LastSeen ?? 0) // We send 0 for guest users by default
            }).ToArray()
        }).ToArray();
        return data;
    }

    public UserInfo[] GetStartingUserInfo(int? rawId)
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
    /// <summary>
    /// Raw data contains in the attachment
    /// </summary>
    public byte[] Data { set; get; }
    /// <summary>
    /// Name of the file of the attachment
    /// </summary>
    public string Filename { set; get; }
    /// <summary>
    /// <see href="https://developer.mozilla.org/fr/docs/Web/HTTP/Guides/MIME_types"></see>
    /// </summary>
    public string Mimetype { set; get; }
}

/// <summary>
/// Represent a user account
/// A user can be one of the following:
/// - User: Login with a password
/// - AltUser: Attached to an user, need to login with the main user
/// - Webhook: Listen to a server, use a webhook URL
/// </summary>
public class UserContext
{
    [Key] public int Id { set; get; }
    /// <summary>
    /// Display name of the user
    /// </summary>
    public string Username { set; get; }
    /// <summary>
    /// User only
    /// Hashed password of the user
    /// </summary>
    public string? Password { set; get; }
    /// <summary>
    /// AltUser only
    /// Which user is the current account dependent of
    /// </summary>
    public int? DependsOf { set; get; }
    /// <summary>
    /// AltUser only
    /// Prefix that can be used to identify a message as the current altuser
    /// </summary>
    public string? Prefix { set; get; }
    /// <summary>
    /// Webhook only
    /// Target webhook to which a message need to be dispatched to
    /// </summary>
    public string? Webhook { set; get; }

    /// <summary>
    /// Color of the account pfp
    /// </summary>
    public int Color { set; get; }
    /// <summary>
    /// Character in the account pfp
    /// </summary>
    public string Character { set; get; }

    /// <summary>
    /// For each channel, when were messages last seen
    /// </summary>
    public List<ChannelSeen> LastSeens { set; get; } = [];
}

/// <summary>
/// Represent information of when was a channel seen by a specific user
/// </summary>
public class ChannelSeen
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public int ServId { set; get; }
    public int ChanId { set; get; }
    public long LastSeen { set; get; }
}

/// <summary>
/// Represent a server
/// </summary>
public class ServerContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    /// <summary>
    /// Display name of the server
    /// </summary>
    public string Name { set; get; }
    /// <summary>
    /// Color of the server icon
    /// </summary>
    public int Color { set; get; }
    /// <summary>
    /// Character inside the server icon
    /// </summary>
    public string Character { set; get; }
    /// <summary>
    /// List of channels available on this server
    /// </summary>
    public List<ChannelContext> Channels { set; get; } = [];
    /// <summary>
    /// Users that are allowed to access this channels, if null anyone with an account can access it
    /// </summary>
    public List<int>? AllowedUsers { set; get; } = null;

    /// <summary>
    /// Ephemerals servers only keep X messages in their channels
    /// When a channel get more than the allowed amount of messages, the old ones are deleted
    /// </summary>
    public bool IsEphemeral { set; get; } = false;
    /// <summary>
    /// Guests are users that don't need to login
    /// They aren't allowed to send attachments
    /// </summary>
    public bool AllowsGuest { set; get; } = false;
}

/// <summary>
/// Represent a channel of conversation within a server
/// </summary>
public class ChannelContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    /// <summary>
    /// Display name of the channel
    /// </summary>
    public string Name { set; get; }
    /// <summary>
    /// Short description of the channel
    /// </summary>
    public string? Description { set; get; }
    /// <summary>
    /// All messages sent on this channel
    /// </summary>
    public List<MessageContext> Messages { set; get; } = [];
}

/// <summary>
/// Represent a message sent in a channel
/// </summary>
public class MessageContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    /// <summary>
    /// Date at which the message was created
    /// </summary>
    public DateTime CreationTime { set; get; }

    /// <summary>
    /// Content of the message
    /// </summary>
    public string Message { set; get; }
    /// <summary>
    /// Authors of the messages
    /// Usually have only one, can have more if co-fronting feature was enabled
    /// </summary>
    public int[] Authors { set; get; }
    /// <summary>
    /// Files attached to the message
    /// </summary>
    public List<AttachmentContext> Attachments { set; get; } = [];
    /// <summary>
    /// List of users that added a heart as reaction to the message
    /// </summary>
    public List<int> Reactions { set; get; } = [];
}
