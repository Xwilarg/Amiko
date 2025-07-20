using Amiko.Server.Database.Context;
using Amiko.Server.Models.Response;

namespace Amiko.Server.Database.Dao;

public static class ChannelQuery
{
    public static ChannelContext? GetChannel(
        SqliteContext ctx,
        int servId,
        int chanId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var s = ServerQuery.GetServer(ctx, servId, claimId, msgCount, includes);
        return s?.Channels?.FirstOrDefault(x => x.Id == chanId);
    }

    public static int AddChannel(SqliteContext ctx, int servId, string name)
    {
        var s = ServerQuery.GetServerRaw(ctx, servId);
        if (s == null) return -1;

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
}
