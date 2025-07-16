using Amiko.Server.Database.Context;

namespace Amiko.Server.Models.Response;

public class ChannelInfo
{
    public int Id { set; get; }
    public string Name { set; get; }
    public string? Description { set; get; }
    public Message[] Messages { set; get; }
    public long LastSeen { set; get; }

    public static ChannelInfo From(int servId, ChannelContext c, UserContext? user)
    {
        return new ChannelInfo()
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Messages = c.Messages.OrderBy(x => x.Id).Select(x => Message.From(x)).ToArray(),
            LastSeen = user == null ? 0 : (user.LastSeens.FirstOrDefault(x => x.ServId == servId && x.ChanId == c.Id)?.LastSeen ?? 0) // We send 0 for guest users by default
        };
    }
}
