using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record ServerDao(
    int Id,
    string Name,
    int Color,
    string Character,
    IEnumerable<ChannelDao> Channels,
    bool IsPublic,
    bool IsEphemeral,
    bool AllowsGuest
)
{
    internal static ServerDao From(ServerContext ctx)
    {
        return From(ctx, ctx.Channels.Select(ChannelDao.From));
    }

    internal static ServerDao From(ServerContext ctx, IEnumerable<ChannelDao> channels)
    {
        return new(
            ctx.Id,
            ctx.Name,
            ctx.Color,
            ctx.Character,
            channels,
            ctx.IsPublic,
            ctx.IsEphemeral,
            ctx.AllowsGuest
        );
    }
}
