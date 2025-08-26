using Amiko.Database.Dao;

namespace Amiko.Server.Models.Message;

public class ChannelMessageBase
{
    public string? Name { set; get; }
}

public class ChannelUpdateMessage : ChannelMessageBase, IBaseMessage
{
    public int ServId { set; get; }
    public int ChanId { set; get; }
    public UpdateType UpdateType { set; get; }

    public MessageType Type => MessageType.ChannelUpdate;
}

public class ChannelInfoMessage : ChannelMessageBase
{
    public required int Id { set; get; }
    public string? Description { set; get; }
    public required MessageInfo[] Messages { set; get; }
    public required long LastSeen { set; get; }

    public static ChannelInfoMessage From(int servId, ChannelDao c, UserDao? user)
    {
        return new ChannelInfoMessage()
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Messages = c.Messages.OrderBy(x => x.Id).Select(x => MessageInfo.From(x)).ToArray(),
            LastSeen = user == null ? 0 : (user.LastSeens.FirstOrDefault(x => x.ServId == servId && x.ChanId == c.Id)?.LastSeen ?? 0) // We send 0 for guest users by default
        };
    }
}
