using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record ServerDao(
    int Id,
    string Name,
    string Character,
    IEnumerable<ChannelDao> Channels,
    bool IsPublic,
    bool IsEphemeral,
    bool AllowsGuest
)
{
    internal static ServerDao From(ServerContext ctx)
    {
        return new(
            ctx.Id,
            ctx.Name,
            ctx.Character,
            ctx.Channels.Select(ChannelDao.From),
            ctx.IsPublic,
            ctx.IsEphemeral,
            ctx.AllowsGuest
        );
    }

    internal static ServerDao From(ServerContext ctx, IEnumerable<ChannelDao> channels)
    {
        return new(
            ctx.Id,
            ctx.Name,
            ctx.Character,
            channels,
            ctx.IsPublic,
            ctx.IsEphemeral,
            ctx.AllowsGuest
        );
    }
}
