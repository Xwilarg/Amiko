namespace Amiko.Server.Models
{
    public class Config
    {
        public UserConfig[] Users { set; get; }
        public ServerConfig[] Servers { set; get; }
    }

    public class UserConfig
    {
        public int Id { set; get; }
        public string Username { set; get; }
        public string? Password { set; get; }
        /// <summary>
        /// Alt account
        /// </summary>
        public int? DependsOf { set; get; }
        public string? Prefix { set; get; }

        public string? Webhook { set; get; }

        public Color? Color { set; get; }
        public string? Character { set; get; }
    }

    public class Color
    {
        public byte R { set; get; }
        public byte G { set; get; }
        public byte B { set; get; }
    }

    public class ServerConfig
    {
        public string Name { set; get; }
        public ChannelConfig[] Channels { set; get; }
        public int[]? AllowedUsers { set; get; }
    }

    public class ChannelConfig
    {
        public string Name { set; get; }
    }
}
