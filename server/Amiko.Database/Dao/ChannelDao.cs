using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record ChannelDao(
    int Id,
    string Name,
    string? Description,
    IEnumerable<MessageDao> Messages
)
{
    internal static ChannelDao From(ChannelContext ctx)
    {
        return From(ctx, ctx.Messages);
    }

    internal static ChannelDao From(ChannelContext ctx, IEnumerable<MessageContext> messages)
    {
        return new(
            ctx.Id,
            ctx.Name,
            ctx.Description,
            messages.Select(MessageDao.From)
        );
    }
}
