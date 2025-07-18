using Amiko.Server.Database.Context;

namespace Amiko.Server.Models.Response;

public class ServerInfo : BaseMessage
{
    public int Id { set; get; }
    public string Name { set; get; }
    public ChannelInfo[] Channels { set; get; }
    public Color Color { set; get; }
    public string Character { set; get; }

    public bool IsEphemeral { set; get; }
    public bool AllowsGuest { set; get; }

    public static ServerInfo From(ServerContext s, UserContext? requester)
    {
        return new()
        {
            Type = MessageType.ServerInfo,
            Id = s.Id,
            Name = s.Name,
            Color = new Color()
            {
                R = (byte)(s.Color >> 16 & 0xff),
                G = (byte)(s.Color >> 8 & 0xff),
                B = (byte)(s.Color >> 0 & 0xff)
            },
            Character = s.Character,
            IsEphemeral = s.IsEphemeral,
            AllowsGuest = s.AllowsGuest,
            Channels = s.Channels.Select(c => ChannelInfo.From(s.Id, c, requester)).ToArray()
        };
    }
}