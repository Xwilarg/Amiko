using Amiko.Server.Database.Context;

namespace Amiko.Server.Database.Dao;

public static class MessageQuery
{
    public static MessageContext? GetMessage(
        SqliteContext ctx,
        int servId,
        int chanId,
        int msgId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var c = ChannelQuery.GetChannel(ctx, servId, chanId, claimId, msgCount, includes);
        return c?.Messages?.FirstOrDefault(x => x.Id == msgId);
    }

    

    public static int AddMessage(SqliteContext ctx, int servId, int chanId, int? claimId, MessageContext msg)
    {
        var serv = ServerQuery.GetServer(ctx, servId, claimId, null, ServerIncludes.IncludesMessages);
        if (serv == null) return -1;

        var chan = serv.Channels.FirstOrDefault(x => x.Id == chanId);
        if (chan == null) return -1;

        chan.Messages.Add(msg);
        if (serv.IsEphemeral) {
            chan.Messages = chan.Messages.TakeLast(100).ToList(); // Ephemeral channels always keep 100 messages at most
        }
        ctx.SaveChanges();

        return msg.Id;
    }
}
