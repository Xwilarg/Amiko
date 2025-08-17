using Amiko.Database.Context;
using Amiko.Database.Dao;
using System.Xml.Linq;

namespace Amiko.Database.Queries;

public static class ChannelQuery
{
    internal static ChannelContext? GetChannelInternal(
        SqliteContext ctx,
        int servId,
        int chanId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var s = ServerQuery.GetServerInternal(ctx, servId, claimId, msgCount, includes);
        return s?.Channels?.FirstOrDefault(x => x.Id == chanId);
    }

    public static ChannelDao? GetChannel(
        SqliteContext ctx,
        int servId,
        int chanId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var c = GetChannelInternal(ctx, servId, chanId, claimId, msgCount, includes);
        return c == null ? null : ChannelDao.From(c);
    }

    public static int AddChannel(SqliteContext ctx, int claimId, int servId, string name)
    {
        var s = ServerQuery.GetServerRaw(ctx, servId);
        if (s == null) return -1;

        if (!ServerQuery.CanAccessServer(ctx, servId, claimId)) return -1;

        var chan = new ChannelContext()
        {
            Name = name,
            Description = string.Empty,
            Messages = []
        };
        s.Channels.Add(chan);
        ctx.SaveChanges();

        return chan.Id;
    }

    public static bool UpdateChannel(SqliteContext ctx, int claimId, int servId, int chanId, string newName)
    {
        var c = GetChannelInternal(ctx, servId, chanId, claimId, null, ServerIncludes.IncludesChannels);
        if (c == null) return false;

        c.Name = newName;
        ctx.SaveChanges();

        return true;
    }

    public static bool DeleteChannel(SqliteContext ctx, int claimId, int servId, int chanId)
    {
        var c = GetChannelInternal(ctx, servId, chanId, claimId, null, ServerIncludes.IncludesChannels);
        if (c == null) return false;

        var s = ServerQuery.GetServerRaw(ctx, servId);
        if (s == null) return false;

        s.Channels.Remove(c);
        ctx.SaveChanges();

        return true;
    }
}
