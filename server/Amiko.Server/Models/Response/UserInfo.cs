using Amiko.Server.Database.Context;

namespace Amiko.Server.Models.Response;

public class UserInfo : BaseMessage
{
    public int Id { set; get; }
    public bool IsMe { set; get; }
    public bool IsMyGroup { set; get; }
    public string Username { set; get; }
    public Color Color { set; get; }
    public string Character { set; get; }

    public static UserInfo From(UserContext u, int? myRawId)
    {
        return new UserInfo()
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

            IsMe = u.Id == myRawId,
            IsMyGroup = u.Id == myRawId || u.DependsOf == myRawId
        };
    }
}
