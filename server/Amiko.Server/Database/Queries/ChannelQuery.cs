using Amiko.Server.Database.Context;

namespace Amiko.Server.Database.Dao;

public static class ChannelQuery
{
    public static ChannelContext? GetChannel(SqliteContext ctx, int servId, int chanId, int? claimId)
    {
        var s = ServerQuery.GetServerWithChannels(ctx, servId, claimId);
        if (s == null) return null;
        return s.Channels.First(x => x.Id == chanId);
    }

    public static ChannelContext? GetChannelWithMessages(SqliteContext ctx, int servId, int chanId, int? claimId)
    {
        var s = ServerQuery.GetAccessibleServersWithMessages(ctx, servId, claimId);
        if (s == null) return null;
        return s.Channels.First(x => x.Id == chanId);
    }
}
