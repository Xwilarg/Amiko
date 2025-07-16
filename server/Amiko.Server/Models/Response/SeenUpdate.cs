namespace Amiko.Server.Models.Response;

public class SeenUpdate : BaseMessage
{
    public int ServerId { set; get; }
    public int ChannelId { set; get; }
}