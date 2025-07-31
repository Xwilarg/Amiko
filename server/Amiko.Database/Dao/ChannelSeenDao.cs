using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record ChannelSeenDao(
    int ServId,
    int ChanId,
    long LastSeen
)
{
    internal static ChannelSeenDao From(ChannelSeenContext ctx)
    {
        return new(ctx.ServId, ctx.ChanId, ctx.LastSeen);
    }
}
