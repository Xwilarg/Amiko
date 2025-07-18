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
