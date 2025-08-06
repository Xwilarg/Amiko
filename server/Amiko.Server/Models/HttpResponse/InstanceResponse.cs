namespace Amiko.Server.Models.HttpResponse
{
    public class InstanceResponse
    {
        public bool IsInit { set; get; }
        public bool AllowsGuest { set; get; }
        public string Version => "1.0.0-beta";
    }
}
