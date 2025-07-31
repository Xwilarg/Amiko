namespace Amiko.Server.Models.Message;

public class SeenUpdateMessage : BaseMessage
{
    public int ServerId { set; get; }
    public int ChannelId { set; get; }
}