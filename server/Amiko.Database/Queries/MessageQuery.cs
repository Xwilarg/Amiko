using Amiko.Database.Context;

namespace Amiko.Database.Queries;

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

    public static IEnumerable<MessageContext> GetMessages(
        SqliteContext ctx,
        int servId,
        int chanId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var c = ServerQuery.GetServersAsQueryableInternal(ctx, claimId, includes)?.FirstOrDefault(x => x.Id == servId)?.Channels?.FirstOrDefault(x => x.Id ==  chanId);
        if (c == null) return [];
        if (msgCount == null)
        {
            return c.Messages;
        }
        return c.Messages.Take(msgCount.Value);
    }

    public static int AddMessage(SqliteContext ctx, int servId, int chanId, int? claimId, MessageContext msg)
    {
        var serv = ServerQuery.GetServer(ctx, servId, claimId, null, ServerIncludes.IncludesMessages);
        if (serv == null) return -1;

        var chan = serv.Channels.FirstOrDefault(x => x.Id == chanId);
        if (chan == null) return -1;

        chan.Messages.Add(msg);
        Console.WriteLine($"Curr count: {chan.Messages.Count}");
        if (serv.IsEphemeral) {
            chan.Messages = chan.Messages.TakeLast(100).ToList(); // Ephemeral channels always keep 100 messages at most
        }
        Console.WriteLine($"Final count: {chan.Messages.Count}");
        Console.WriteLine($"Last msg: {chan.Messages.Last().Message}");
        ctx.SaveChanges();

        return msg.Id;
    }
}
