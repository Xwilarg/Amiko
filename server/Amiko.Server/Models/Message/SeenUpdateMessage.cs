namespace Amiko.Server.Models.Message;

public class SeenUpdateMessage : IBaseMessage
{
    public int ServerId { set; get; }
    public int ChannelId { set; get; }

    public MessageType Type => MessageType.SeenUpdate;
}