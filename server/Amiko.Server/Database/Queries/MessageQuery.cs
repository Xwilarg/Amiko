using Amiko.Server.Database.Context;
using Microsoft.EntityFrameworkCore;

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

    

    public static void AddChannel(SqliteContext ctx, int servId, int chanId, MessageContext msg)
    {
        /*
        var serv = _ctx.Servers.Include(s => s.Channels).ThenInclude(c => c.Messages).FirstOrDefault(x => x.Id == servId);
        if (serv == null) throw new InvalidOperationException("Server not found");

        var chan = serv.Channels.FirstOrDefault(x => x.Id == chanId);
        if (chan == null) throw new InvalidOperationException("Channel not found");

        chan.Messages.Add(msg);
        if (serv.IsEphemeral) {
            chan.Messages = chan.Messages.TakeLast(100).ToList(); // Ephemeral channels always keep 100 messages at most
        }
        _ctx.SaveChanges();

        return msg.Id;
        */
    }
}
