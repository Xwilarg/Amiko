using Amiko.Server.Database.Context;
using Amiko.Server.Models.Response;
using Microsoft.EntityFrameworkCore;

namespace Amiko.Server.Database.Dao;

public enum ServerIncludes
{
    None,
    IncludesChannels,
    IncludesMessages,
    IncludesAttachments
}

public static class ServerQuery
{
    public static IEnumerable<ServerContext> GetServers(
        SqliteContext ctx,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        return GetServersAsQueryable(ctx, claimId, msgCount, includes);
    }

    public static IQueryable<ServerContext> GetServersAsQueryable(
        SqliteContext ctx,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        IQueryable<ServerContext> servers;
        if (includes == ServerIncludes.IncludesAttachments)
        {
            if (msgCount == null)
            {
                servers = ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).ThenInclude(m => m.Attachments);
            }
            else
            {
                servers = ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages.Take(msgCount.Value)).ThenInclude(m => m.Attachments);
            }
        }
        else if (includes == ServerIncludes.IncludesMessages)
        {
            if (msgCount == null)
            {
                servers = ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages);
            }
            else
            {
                servers = ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages.Take(msgCount.Value));
            }
        }
        else if (includes == ServerIncludes.IncludesChannels)
        {
            servers = ctx.Servers.Include(s => s.Channels);
        }
        else
        {
            servers = ctx.Servers;
        }
        return servers.Where(s => s.CanAccessServer(claimId));
    }

    public static ServerContext? GetServer(
        SqliteContext ctx,
        int servId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        return GetServersAsQueryable(ctx, claimId, msgCount, includes).FirstOrDefault(x => x.Id == servId);
    }

    public static ServerContext? GetServerRaw(SqliteContext ctx, int servId)
    {
        return ctx.Servers.FirstOrDefault(x => x.Id == servId);
    }

    public static int AddServer(SqliteContext ctx, string name)
    {
        var serv = new ServerContext()
        {
            Name = name,
            AllowedUsers = null,
            Color = 54 << 16 | 54 << 8 | 54,
            Character = name[0].ToString(),
            IsEphemeral = false,
            AllowsGuest = false
        };
        ctx.Servers.Add(serv);
        ctx.SaveChanges();

        return serv.Id;
    }

    public static bool CanAccessServer(SqliteContext ctx, int servId, int? claimId)
    {
        return GetServer(ctx, servId, claimId, null, ServerIncludes.None)?.CanAccessServer(claimId) ?? false;
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
