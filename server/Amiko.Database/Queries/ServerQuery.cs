using Amiko.Database.Context;
using Amiko.Database.Dao;
using Microsoft.EntityFrameworkCore;

namespace Amiko.Database.Queries;

public enum ServerIncludes
{
    None,
    IncludesChannels,
    IncludesMessages,
    IncludesAttachments
}

public static class ServerQuery
{
    public static IEnumerable<ServerDao> GetServers(
        SqliteContext ctx,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var servers = GetServersAsQueryable(ctx, claimId, includes >= ServerIncludes.IncludesMessages ? ServerIncludes.IncludesChannels : includes);
        
        if (includes >= ServerIncludes.IncludesMessages)
        {
            List<ServerDao> daos = [];
            foreach (var s in servers)
            {
                var chans = s.Channels.Select(x => ChannelDao.From(x, MessageQuery.GetMessages(ctx, s.Id, x.Id, claimId, msgCount, includes)));
                daos.Add(ServerDao.From(s, chans));
            }
        }
        return servers.Select(ServerDao.From);
    }

    internal static IQueryable<ServerContext> GetServersAsQueryableInternal(
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

    internal static IQueryable<ServerContext> GetServersAsQueryable(
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

    internal static ServerContext? GetServerInternal(
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

    public static ServerDao? GetServer(
        SqliteContext ctx,
        int servId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var s = GetServerInternal(ctx, servId, claimId, msgCount, includes);
        return s == null ? null : ServerDao.From(s);
    }

    internal static ServerContext? GetServerRaw(SqliteContext ctx, int servId)
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

    public static bool UpdateServer(SqliteContext ctx, int servId, int claimId,
        Color? color, string? character, string? name, bool? allowsGuest, bool? isEphemeral)
    {
        var s = GetServerInternal(ctx, servId, claimId, null, ServerIncludes.None);

        if (s == null) return false;

        if (color != null) s.Color = color.R << 16 | color.G << 8 | color.B;
        if (character != null) s.Character = character;
        if (name != null) s.Name = name;
        if (allowsGuest != null) s.AllowsGuest = allowsGuest.Value;
        if (isEphemeral != null) s.IsEphemeral = isEphemeral.Value;

        ctx.SaveChanges();
        return true;
    }

    public static bool IsAnyServerPublic(SqliteContext ctx)
        => GetServersAsQueryable(ctx, null, ServerIncludes.None).Any(s => s.AllowsGuest && s.IsPublic);

    internal static bool CanAccessServer(SqliteContext ctx, ServerContext s, int servId, int? claimId)
    {
        if (claimId == null)
        { // Authentificated user
            return s.AllowsGuest && s.IsPublic;
        }
        return s.IsPublic || ctx.AllowUsers.Any(x => x.UserId == claimId.Value && x.ServerId == s.Id); // There is no whitelist or user is allowed
    }

    public static bool CanAccessServer(SqliteContext ctx, int servId, int? claimId)
    {
        var s = GetServerInternal(ctx, servId, claimId, null, ServerIncludes.None);

        if (s == null) return false;

        return CanAccessServer(ctx, s, servId, claimId);
    }
}
