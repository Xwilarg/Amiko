namespace Amiko.Server.Models
{
    public class Config
    {
        public UserConfig[] Users { set; get; }
        public ServerConfig[] Servers { set; get; }
    }

    public class UserConfig
    {
        public string Id { set; get; }
        public string Username { set; get; }
        public string? Password { set; get; }
        public string? DependsOf { set; get; }

        public Color Color { set; get; } = new() { R = 54, G = 54, B = 54 };
        public char? Character { set; get; }
    }

    public class Color
    {
        public int R { set; get; }
        public int G { set; get; }
        public int B { set; get; }
    }

    public class ServerConfig
    {
        public string Name { set; get; }
        public ChannelConfig[] Channels { set; get; }
    }

    public class ChannelConfig
    {
        public string Name { set; get; }
    }
}
