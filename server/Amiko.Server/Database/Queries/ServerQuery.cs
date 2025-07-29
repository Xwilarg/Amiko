using Amiko.Server.Database.Context;
using Amiko.Server.Models.Response;
using Microsoft.EntityFrameworkCore;
using System.Drawing;

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
        var servers = GetServersAsQueryable(ctx, claimId, includes >= ServerIncludes.IncludesMessages ? ServerIncludes.IncludesChannels : includes);
        if (includes >= ServerIncludes.IncludesMessages)
        {
            foreach (var s in servers)
            {
                foreach (var c in s.Channels)
                {
                    c.Messages = MessageQuery.GetMessages(ctx, s.Id, c.Id, claimId, msgCount, includes).ToList();
                }
            }
        }
        return servers;
    }

    public static IQueryable<ServerContext> GetServersAsQueryableInternal(
        SqliteContext ctx,
        int? claimId,
        ServerIncludes includes)
    {
        IQueryable<ServerContext> servers;
        if (includes == ServerIncludes.IncludesAttachments)
        {
            return ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).ThenInclude(m => m.Attachments);
        }
        if (includes == ServerIncludes.IncludesMessages)
        {
            return ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages);
        }
        if (includes == ServerIncludes.IncludesChannels)
        {
            return ctx.Servers.Include(s => s.Channels);
        }
        return ctx.Servers;
    }

    public static IQueryable<ServerContext> GetServersAsQueryable(
        SqliteContext ctx,
        int? claimId,
        ServerIncludes includes)
    {
        var servers = GetServersAsQueryableInternal(ctx, claimId, includes);
        if (claimId == null)
        {
            return servers.Where(s => s.AllowsGuest && s.IsPublic);
        }

        var allowedServers = ctx.AllowUsers.Where(x => x.UserId == claimId).Select(x => x.ServerId);
        return servers.Where(s => s.IsPublic || allowedServers.Contains(s.Id));
    }

    public static ServerContext? GetServer(
        SqliteContext ctx,
        int servId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var s = GetServersAsQueryableInternal(ctx, claimId, includes >= ServerIncludes.IncludesMessages ? ServerIncludes.IncludesChannels : includes).FirstOrDefault(x => x.Id == servId);
        if (s == null || !CanAccessServer(ctx, s, servId, claimId))
        {
            return null;
        }

        if (includes >= ServerIncludes.IncludesMessages)
        {
            foreach (var c in s.Channels)
            {
                c.Messages = MessageQuery.GetMessages(ctx, servId, c.Id, claimId, msgCount, includes).ToList();
            }
        }
        return s;
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
            Channels = [],
            IsPublic = true,
            Color = 54 << 16 | 54 << 8 | 54,
            Character = name[0].ToString(),
            IsEphemeral = false,
            AllowsGuest = false
        };
        ctx.Servers.Add(serv);
        ctx.SaveChanges();

        return serv.Id;
    }

    public static bool UpdateServer(SqliteContext ctx, int servId, int claimId, ServerUpdate msg)
    {
        var s = GetServer(ctx, servId, claimId, null, ServerIncludes.None);

        if (s == null) return false;

        if (msg.Color != null) s.Color = (msg.Color.R << 16 | (msg.Color.G << 8 | (msg.Color.B;
        if (msg.Character != null) s.Character = msg.Character;
        return true;
    }

    public static bool CanAccessServer(SqliteContext ctx, ServerContext s, int servId, int? claimId)
    {
        if (claimId == null)
        { // Authentificated user
            return s.AllowsGuest && s.IsPublic;
        }
        return s.IsPublic || ctx.AllowUsers.Any(x => x.UserId == claimId.Value && x.ServerId == s.Id); // There is no whitelist or user is allowed
    }

    public static bool CanAccessServer(SqliteContext ctx, int servId, int? claimId)
    {
        var s = GetServer(ctx, servId, claimId, null, ServerIncludes.None);

        if (s == null) return false;

        return CanAccessServer(ctx, s, servId, claimId);
    }
}
