using Amiko.Models;
using Amiko.Server.Models;
using System.Text.Json;

namespace Amiko.Server.Services;

public class UserManager
{
    private User[] _users;

    public UserManager()
    {
        if (!File.Exists("credentials.json"))
        {
            throw new InvalidOperationException();
        }
        _users = JsonSerializer.Deserialize<User[]>(File.ReadAllText("credentials.json"), new JsonSerializerOptions()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }

    public DataGroup<UserInfo> GetAllUsersInfo(string myId)
    {
        return new DataGroup<UserInfo>()
        {
            Type = MessageType.UserInfo,
            Data = _users.Select(x => new UserInfo()
            {
                Id = x.Id,
                IsMe = x.Id == myId,
                Username = x.Username
            }).ToArray()
        };
    }

    public User? GetUserFromPassword(string hash)
    {
        return _users.FirstOrDefault(x => hash == x.Password);
    }

    public User? GetUserFromId(string id)
    {
        return _users.FirstOrDefault(x => id == x.Id);
    }
}
