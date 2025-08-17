using Amiko.Database.Context;
using Amiko.Database.Queries;
using Amiko.Server.Models.Message;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace Amiko.Server.Services;

/// <summary>
/// Store all connections
/// </summary>
public class ConnectionManager
{
    public ConnectionManager(JsonSerializerOptions options)
    {
        _options = options;
    }

    public List<UserSocket> Sockets { get; } = [];
    private JsonSerializerOptions _options;

    public async Task BroadcastMessageAsync<T>(SqliteContext dbContext, int? serverId, T prot) where T : IBaseMessage
    {
        List<Task> tasks = [];
        lock (Sockets)
        {
            // Connected users
            foreach (var s in Sockets.Where(x => serverId == null || ServerQuery.CanAccessServer(dbContext, serverId.Value, x.ClaimId))) // Send the message to every users
            {
                var msg = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(prot, _options));
                Task t = s.WebSocket.SendAsync(msg, WebSocketMessageType.Text, true, CancellationToken.None);
                tasks.Add(t);
            }
        }
        foreach (var t in tasks)
        {
            try
            {
                await t;
            }
            catch (Exception e)
            { }
        }
    }

    public async Task PropagateAttachment(int msgId, AttachmentMessage[] attachments)
    {
        List<Task> tasks = [];
        lock (Sockets)
        {
            foreach (var s in Sockets)
            {
                var msg = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new MessageInfo()
                {
                    Id = msgId,
                    Attachments = attachments
                }, _options));
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

    public bool IsAdmin { set; get; }

    /// <summary>
    /// Actual web socket
    /// </summary>
    public WebSocket WebSocket { set; get; }
}
