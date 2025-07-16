using Amiko.Server.Database.Context;
using Microsoft.EntityFrameworkCore;

namespace Amiko.Server.Database.Dao;

public static class MessageQuery
{
    /*public static IEnumerable<MessageContext> GetMessage(SqliteContext ctx, int servId, int chanId, int msgCount)
    {
        return ctx.Servers
            .Include(s => s.Channels)
            .ThenInclude(c => c.Messages)
            .ThenInclude(m => m.Attachments)
            .First(x => x.Id == servId).Channels
            .First(x => x.Id == chanId).Messages
            .TakeLast(msgCount);
    }*/

    public static MessageContext? GetMessage(SqliteContext ctx, int servId, int chanId, int msgId, int? claimId)
    {
        var c = ChannelQuery.GetChannelWithMessages(ctx, servId, chanId, claimId);
        if (c == null) return null;
        return c.Messages.First(x => x.Id == msgId);
    }
}
