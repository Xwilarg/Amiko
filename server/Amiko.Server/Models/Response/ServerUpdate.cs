namespace Amiko.Server.Models.Response;

public class ServerUpdate : BaseMessage
{
    public int Id { set; get; }
    public Color? Color { set; get; }
    public string? Character { set; get; }
    public string? Name { set; get; }
    public bool? AllowsGuest { set; get; }
    public bool? IsEphemeral { set; get; }
}