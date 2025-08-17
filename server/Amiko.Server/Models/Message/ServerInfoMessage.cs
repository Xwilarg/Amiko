using Amiko.Database;
using Amiko.Database.Dao;

namespace Amiko.Server.Models.Message;

public class ServerMessageBase
{
    public int Id { set; get; }
    public string? Name { set; get; }
    public Color? Color { set; get; }
    public string? Character { set; get; }

    public bool? IsEphemeral { set; get; }
    public bool? AllowsGuest { set; get; }
}

public class ServerUpdateMessage : ServerMessageBase, IBaseMessage
{
    public UpdateType UpdateType { set; get; }
    public MessageType Type => MessageType.ServerUpdate;
}

public class ServerInfoMessage : ServerMessageBase, IBaseMessage
{
    public ChannelInfoMessage[]? Channels { set; get; }

    public static ServerInfoMessage From(ServerDao s, UserDao? requester)
    {
        return new()
        {
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
            Channels = s.Channels.Select(c => ChannelInfoMessage.From(s.Id, c, requester)).ToArray()
        };
    }

    public MessageType Type => MessageType.ServerInfo;
}