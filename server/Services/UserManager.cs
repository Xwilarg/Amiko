using Amiko.Models;
using Amiko.Server.Models;
using System.Text.Json;

namespace Amiko.Server.Services;

public class UserManager
{
    private UserConfig[] _users;

    public UserManager()
    {
        if (!File.Exists("config.json"))
        {
            throw new InvalidOperationException();
        }
        _users = JsonSerializer.Deserialize<Config>(File.ReadAllText("config.json"), new JsonSerializerOptions()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }).Users;
    }

    public UserInfo[] GetAllUsersInfo(string myId)
    {
        return _users.Select(x => new UserInfo()
        {
            Type = MessageType.UserInfo,
            Id = x.Id,
            IsMe = x.Id == myId,
            Username = x.Username
        }).ToArray();
    }

    public UserConfig? GetUserFromPassword(string hash)
    {
        return _users.FirstOrDefault(x => hash == x.Password);
    }

    public UserConfig? GetUserFromId(string id)
    {
        return _users.FirstOrDefault(x => id == x.Id);
    }
}
