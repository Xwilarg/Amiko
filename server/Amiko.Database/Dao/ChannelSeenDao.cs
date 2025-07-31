using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record ChannelSeenDao(
    int servId,
    int chanId,
    long lastSeen
)
{
    internal static ChannelSeenDao From(ChannelSeenContext ctx)
    {
        return new(ctx.ServId, ctx.ChanId, ctx.LastSeen);
    }
}
