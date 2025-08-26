using Amiko.Database.Context;
using Amiko.Database.Queries;
using Amiko.Server.Models.Message;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

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

    /// <summary>
    /// Broadcast a message to all connected websockets
    /// </summary>
    /// <typeparam name="T">Message to broadcast</typeparam>
    /// <param name="dbContext">Database context</param>
    /// <param name="serverId">
    /// Server related to the query
    /// Allow to filter users, if null send to everyone
    /// </param>
    /// <param name="prot">Message</param>
    /// <param name="except">Id to exclude, null to not exclude anyone</param>
    public async Task BroadcastMessageAsync<T>(SqliteContext dbContext, int? serverId, T prot, WebSocket? except) where T : IBaseMessage
    {
        List<Task> tasks = [];
        lock (Sockets)
        {
            // Connected users
            foreach (var s in Sockets.Where(x => serverId == null || ServerQuery.CanAccessServer(dbContext, serverId.Value, x.ClaimId))) // Send the message to every users
            {
                if (except != null && s.WebSocket == except) continue; // Ignore this user

                tasks.Add(SendMessageAsync(s.WebSocket, prot));
            }
        }
        await ExecuteAllTasksAsync(tasks);
    }

    public async Task SendTo<T>(SqliteContext dbContext, T prot, WebSocket target) where T : IBaseMessage
    {
        var task = SendMessageAsync(target, prot);
        try
        {
            await task;
        }
        catch (Exception)
        { }
    }

    private async Task ExecuteAllTasksAsync(IEnumerable<Task> tasks)
    {
        foreach (var t in tasks)
        {
            try
            {
                await t;
            }
            catch (Exception)
            { }
        }
    }

    public Task SendMessageAsync<T>(WebSocket s, T prot)
    {
        var msg = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(prot, _options));
        return s.SendAsync(msg, WebSocketMessageType.Text, true, CancellationToken.None);
    }
}

public class UserSocket
{
    /// <summary>
    /// Claim associated with the socket, used to verify permissions
    /// </summary>
    public int? ClaimId { set; get; }

    public required bool IsAdmin { set; get; }

    /// <summary>
    /// Actual web socket
    /// </summary>
    public required WebSocket WebSocket { set; get; }
}
