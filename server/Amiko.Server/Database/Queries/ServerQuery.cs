using Amiko.Server.Database.Context;
using Microsoft.EntityFrameworkCore;

namespace Amiko.Server.Database.Dao;

public static class ServerQuery
{
    public static IEnumerable<ServerContext> GetAccessibleServersWithMessages(SqliteContext ctx, int? claimId, int msgCount)
    {
        return ctx.Servers
            .Include(s => s.Channels).ThenInclude(c => c.Messages.Take(msgCount)).ThenInclude(m => m.Attachments)
            .Where(s => s.CanAccessServer(claimId));
    }

    public static IEnumerable<ServerContext> GetAccessibleServersWithMessages(SqliteContext ctx, int? claimId)
    {
        return ctx.Servers
            .Include(s => s.Channels).ThenInclude(c => c.Messages).ThenInclude(m => m.Attachments)
            .Where(s => s.CanAccessServer(claimId));
    }

    public static ServerContext? GetServer(SqliteContext ctx, int servId, int? claimId)
    {
        var s = ctx.Servers.First(x => x.Id == servId);
        if (s.CanAccessServer(claimId)) return s;
        return null;
    }

    public static ServerContext? GetServerWithChannels(SqliteContext ctx, int servId, int? claimId)
    {
        var s = ctx.Servers.Include(s => s.Channels).First(x => x.Id == servId);
        if (s.CanAccessServer(claimId)) return s;
        return null;
    }

    private static bool CanAccessServer(this ServerContext s, int? claimId)
    {
        if (claimId != null)
        { // Authentificated user
            return s.AllowedUsers == null || s.AllowedUsers.Contains(claimId.Value); // There is no whitelist or user is allowed
        }

        // Guest user
        return s.AllowsGuest;
    }
}
