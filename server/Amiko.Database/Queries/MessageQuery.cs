using Amiko.Database.Context;

namespace Amiko.Database.Queries;

public static class MessageQuery
{
    internal static MessageContext? GetMessage(
        SqliteContext ctx,
        int servId,
        int chanId,
        int msgId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var c = ChannelQuery.GetChannelInternal(ctx, servId, chanId, claimId, msgCount, includes);
        return c?.Messages?.FirstOrDefault(x => x.Id == msgId);
    }

    internal static IEnumerable<MessageContext> GetMessages(
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
        return c.Messages.TakeLast(msgCount.Value);
    }

    public static int AddMessage(SqliteContext ctx, int servId, int chanId, int? claimId,
        DateTime creationTime, string message, int[] authors)
    {
        var serv = ServerQuery.GetServerInternal(ctx, servId, claimId, null, ServerIncludes.IncludesMessages);
        if (serv == null) return -1;

        var chan = serv.Channels.FirstOrDefault(x => x.Id == chanId);
        if (chan == null) return -1;

        var msg = new MessageContext()
        {
            CreationTime = creationTime,
            Message = message,
            Authors = authors
        };
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
