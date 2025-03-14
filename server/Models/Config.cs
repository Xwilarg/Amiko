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
        public string Password { set; get; }
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
