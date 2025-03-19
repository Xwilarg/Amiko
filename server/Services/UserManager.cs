using Amiko.Models;
using Amiko.Server.Models;
using System.Text.Json;

namespace Amiko.Server.Services;

public class UserManager
{
    private UserConfig[] _users;

    /// <summary>
    /// Associate a user to the current ID of the account he is using
    /// </summary>
    private Dictionary<string, string> _activeUsers = [];

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

    private string GetActiveUser(string id)
    {
        return _activeUsers.TryGetValue(id, out string value) ? value : id;
    }

    public bool TrySetActiveUser(string key, string id)
    {
        var target = _users.FirstOrDefault(x => x.Id == id);
        if (target == null) return false;
        if (key != id && (target.DependsOf == null || target.DependsOf != key)) return false;

        if (_activeUsers.ContainsKey(key)) _activeUsers[key] = id;
        else _activeUsers.Add(key, id);

        return true;
    }

    public UserInfo[] GetAllUsersInfo(string rawId, string currId)
    {
        return _users.Select(x => new UserInfo()
        {
            Type = MessageType.UserInfo,
            Id = x.Id,
            IsMe = x.Id == currId,
            IsMyGroup = x.DependsOf == null ? x.Id == rawId : currId == x.DependsOf,
            Username = x.Username,
            Color = x.Color,
            Character = x.Character ?? x.Username[0].ToString()
        }).ToArray();
    }

    public UserConfig? GetUserFromPassword(string hash)
    {
        return _users.FirstOrDefault(x => hash == x.Password);
    }

    public UserConfig? GetUserFromId(string id, string? prefix, out bool isPrefixed)
    {
        var activeId = GetActiveUser(id);

        if (prefix != null)
        {
            // Did we use a prefix to target another user we have access to?
            var prefixUser = _users.FirstOrDefault(x => x.Prefix == prefix && (x.Id == id || x.DependsOf == id));
            if (prefixUser != null)
            {
                isPrefixed = true;
                return prefixUser;
            }
        }

        isPrefixed = false;
        return _users.FirstOrDefault(x => activeId == x.Id);
    }
}
