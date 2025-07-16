using Amiko.Models;
using Amiko.Server.Models;
using Amiko.Server.Models.Response;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace Amiko.Server.Database.Context;

public class ContextInterpreter
{

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
            Color = color.R << 16 | color.G << 8 | color.B,
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
}

public class SqliteContext : DbContext
{
    public DbSet<ServerContext> Servers { set; get; }
    public DbSet<UserContext> Users { set; get; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=Sqlite.db");
}
