namespace Amiko.Server.Models.Message;

public class SeenUpdateMessage : IBaseMessage
{
    public required int ServerId { set; get; }
    public required int ChannelId { set; get; }

    public MessageType Type => MessageType.SeenUpdate;
}