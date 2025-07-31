using Amiko.Database;
using Amiko.Database.Dao;

namespace Amiko.Server.Models.Message;

public class ServerMessage : BaseMessage
{
    public required int Id { set; get; }
    public string? Name { set; get; }
    public ChannelMessage[]? Channels { set; get; }
    public Color? Color { set; get; }
    public string? Character { set; get; }

    public bool? IsEphemeral { set; get; }
    public bool? AllowsGuest { set; get; }

    public static ServerMessage From(ServerDao s, UserDao? requester)
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
            Channels = s.Channels.Select(c => ChannelMessage.From(s.Id, c, requester)).ToArray()
        };
    }
}