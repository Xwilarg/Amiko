using Amiko.Database;
using Amiko.Database.Dao;

namespace Amiko.Server.Models.Message;

public class UserMessageBase
{
    public int Id { set; get; }
    public string? Username { set; get; }
    public Color? Color { set; get; }
    public string? Character { set; get; }
}

public class UserUpdateMessage : UserMessageBase, IBaseMessage
{
    public UpdateType UpdateType { set; get; }

    public MessageType Type => MessageType.UserUpdate;
}

public class UserInfoMessage : UserMessageBase, IBaseMessage
{
    public required bool IsMe { set; get; }
    public required bool IsMyGroup { set; get; }
    public required bool IsAdmin { set; get; }

    public static UserInfoMessage From(UserDao u, int? myRawId)
    {
        return new UserInfoMessage()
        {
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

    public MessageType Type => MessageType.UserInfo;
}
