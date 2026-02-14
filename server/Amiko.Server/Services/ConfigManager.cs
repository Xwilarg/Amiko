using Amiko.Database;
using Amiko.Server.Models;
using System.Text.Json;

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

    private string ConfigPath => $"{RuntimePath.GetPath()}config.json";

    public Config GetConfig()
    {
        return JsonSerializer.Deserialize<Config>(File.ReadAllText(ConfigPath), _options)!;
    }

    public void InitConfig()
    {
        Config? config;
        if (!File.Exists(ConfigPath))
        {
            config = new();
        }
        else
        {
            config = JsonSerializer.Deserialize<Config>(File.ReadAllText(ConfigPath), _options);
            if (config == null) throw new InvalidOperationException("config.json is in an invalid format");
        }

        config.AdminKey ??= Guid.NewGuid().ToString();
        config.SecurityKey ??= Guid.NewGuid().ToString();
        File.WriteAllText(ConfigPath, JsonSerializer.Serialize(config, _options));
    }
}
