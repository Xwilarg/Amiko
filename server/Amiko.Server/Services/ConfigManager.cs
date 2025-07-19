using System.Text.Json;
using Amiko.Server.Models;

namespace Amiko.Server.Services;

/// <summary>
/// Store all connections
/// </summary>
public class ConfigManager
{
    public ConfigManager(JsonSerializerOptions options)
    {
        _options = options;
    }

    private JsonSerializerOptions _options;

    public Config GetConfig()
    {
        return JsonSerializer.Deserialize<Config>(File.ReadAllText("config.json"), _options);
    }

    public void InitConfig()
    {
        Config config;
        if (!File.Exists("config.json"))
        {
            config = new();
        }
        else
        {
            config = JsonSerializer.Deserialize<Config>(File.ReadAllText("config.json"), _options);
        }

        config.AdminKey ??= Guid.NewGuid().ToString();
        File.WriteAllText("config.json", JsonSerializer.Serialize(config, _options));
    }
}
