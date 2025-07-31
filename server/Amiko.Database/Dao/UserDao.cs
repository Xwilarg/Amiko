using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record UserDao(
    int Id,
    bool IsAdmin,
    string Username,
    int? DependsOf,
    string? Prefix,
    string? Webhook,
    int Color,
    string Character,
    IEnumerable<ChannelSeenDao> LastSeens
)
{
    internal static UserDao From(UserContext ctx)
    {
        return new(ctx.Id, ctx.IsAdmin, ctx.Username, ctx.DependsOf, ctx.Prefix, ctx.Webhook, ctx.Color, ctx.Character, ctx.LastSeens.Select(ChannelSeenDao.From));
    }
}
