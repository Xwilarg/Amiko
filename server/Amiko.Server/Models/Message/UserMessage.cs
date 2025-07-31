using Amiko.Database;
using Amiko.Database.Dao;

namespace Amiko.Server.Models.Message;

public class UserMessage : BaseMessage
{
    public int Id { set; get; }
    public bool IsMe { set; get; }
    public bool IsMyGroup { set; get; }
    public bool IsAdmin { set; get; }
    public string Username { set; get; }
    public Color Color { set; get; }
    public string Character { set; get; }

    public static UserMessage From(UserDao u, int? myRawId)
    {
        return new UserMessage()
        {
            Type = MessageType.UserInfo,
            Id = u.Id,
            Username = u.Username,
            Color = new Color()
            {
                R = (byte)(u.Color >> 16 & 0xff),
                G = (byte)(u.Color >> 8 & 0xff),
                B = (byte)(u.Color >> 0 & 0xff)
            },
            Character = u.Character,
            IsAdmin = u.IsAdmin,

            IsMe = u.Id == myRawId,
            IsMyGroup = u.Id == myRawId || u.DependsOf == myRawId
        };
    }
}
