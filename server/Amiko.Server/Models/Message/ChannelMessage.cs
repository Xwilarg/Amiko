using Amiko.Database.Dao;

namespace Amiko.Server.Models.Message;

public class ChannelMessage
{
    public int Id { set; get; }
    public string Name { set; get; }
    public string? Description { set; get; }
    public Message[] Messages { set; get; }
    public long LastSeen { set; get; }

    public static ChannelMessage From(int servId, ChannelDao c, UserDao? user)
    {
        return new ChannelMessage()
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Messages = c.Messages.OrderBy(x => x.Id).Select(x => Message.From(x)).ToArray(),
            LastSeen = user == null ? 0 : (user.LastSeens.FirstOrDefault(x => x.ServId == servId && x.ChanId == c.Id)?.LastSeen ?? 0) // We send 0 for guest users by default
        };
    }
}
