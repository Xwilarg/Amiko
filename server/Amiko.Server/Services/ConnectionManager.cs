using Amiko.Models;
using System.Net.WebSockets;
using System.Text.Json;
using System.Text;
using Amiko.Server.Models.Response;

namespace Amiko.Server.Services;

/// <summary>
/// Store all connections
/// </summary>
public class ConnectionManager
{
    public List<UserSocket> Sockets { get; } = [];

    private JsonSerializerOptions _option;
    public JsonSerializerOptions Option
    {
        get
        {
            _option ??= new()
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            return _option;
        }
    }

    public async Task PropagateAttachment(int msgId, AttachmentInfo[] attachments)
    {
        List<Task> tasks = [];
        lock (Sockets)
        {
            foreach (var s in Sockets)
            {
                var msg = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new Message()
                {
                    Type = MessageType.MessageUpdate,
                    Id = msgId,
                    Attachments = attachments
                }, Option));
                tasks.Add(s.WebSocket.SendAsync(msg, WebSocketMessageType.Text, true, CancellationToken.None));
            }
        }
        foreach (var t in tasks)
        {
            try
            {
                await t;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.ToString());
                return;
                //_logger.LogError(e.ToString());
            }
        }
    }
}

public class UserSocket
{
    /// <summary>
    /// Claim associated with the socket, used to verify permissions
    /// </summary>
    public int? ClaimId { set; get; }

    /// <summary>
    /// Actual web socket
    /// </summary>
    public WebSocket WebSocket { set; get; }
}
