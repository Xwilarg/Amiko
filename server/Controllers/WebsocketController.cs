using Amiko.Models;
using Amiko.Server.Database;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace Amiko.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WebsocketController : ControllerBase
    {
        private readonly ILogger<WebsocketController> _logger;
        private SqliteContext _dbContext;

        public WebsocketController(ILogger<WebsocketController> logger, SqliteContext dbContext)
        {
            _logger = logger;
            _dbContext = dbContext;
        }

        private static JsonSerializerOptions _option;
        private static JsonSerializerOptions Option
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

        private class UserSocket
        {
            public int ClaimId { set; get; }
            public WebSocket WebSocket { set; get; }
        }
        private static readonly List<UserSocket> _sockets = [];

        [Route("/ws"), Authorize]
        public async Task Get()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                // Info of who sent the msg
                var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

                var client = await HttpContext.WebSockets.AcceptWebSocketAsync("client");
                lock (_sockets)
                {
                    _sockets.Add(new() { WebSocket = client, ClaimId = claimId });
                }

                // First connection from user!
                _logger.Log(LogLevel.Information, $"New client connected ({claimId})");

                // Send information about all servers existing
                var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new ArrayMessage<ServerInfo>()
                {
                    Type = MessageType.Array,
                    Data = ContextInterpreter.Get(_dbContext).GetStartingServerInfo(50, claimId)
                }, Option));
                await client.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);

                // Send information about all users existing
                bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new ArrayMessage<UserInfo>()
                {
                    Type = MessageType.Array,
                    Data = ContextInterpreter.Get(_dbContext).GetStartingUserInfo(claimId)
                }, Option));
                await client.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);

                while (true)
                {
                    var buffer = new byte[1024];
                    WebSocketReceiveResult? response;
                    
                    try
                    {
                        response = await client.ReceiveAsync(buffer, CancellationToken.None);
                    }
                    catch (WebSocketException)
                    {
                        lock (_sockets)
                        {
                            _sockets.RemoveAll(x => x.WebSocket == client);
                        }
                        break;
                    }

                    _logger.Log(LogLevel.Information, $"Message received of size {buffer.Length} of type {response.MessageType}");
                    if (response.MessageType == WebSocketMessageType.Text)
                    {

                        // Skip empty bytes at the end
                        buffer = buffer.TakeWhile((v, index) => buffer.Skip(index).Any(w => w != 0x00)).ToArray(); // TODO: ew
                        var now = DateTime.UtcNow;

                        try
                        {
                            var baseMsg = JsonSerializer.Deserialize<BaseMessage>(Encoding.UTF8.GetString(buffer), Option);

                            if (baseMsg.Type == MessageType.Heartbeat)
                            {
                                await client.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
                            }
                            else if (baseMsg.Type == MessageType.SeenUpdate)
                            {
                                var prot = JsonSerializer.Deserialize<SeenUpdate>(Encoding.UTF8.GetString(buffer), Option);
                                var ctx = ContextInterpreter.Get(_dbContext);
                                ctx.UpdateLastSeen(prot.ServerId, prot.ChannelId, claimId, DateTimeOffset.UtcNow.ToUnixTimeSeconds());
                            }
                            else if (baseMsg.Type == MessageType.Message)
                            {
                                // Parse actual message
                                var prot = JsonSerializer.Deserialize<Message>(Encoding.UTF8.GetString(buffer), Option);

                                var ctx = ContextInterpreter.Get(_dbContext);

                                if (!ctx.UpdateLastSeen(prot.ServerId, prot.ChannelId, claimId, DateTimeOffset.UtcNow.ToUnixTimeSeconds()))
                                {
                                    // If this fail, it means we don't have the permissions to view this channel
                                    continue;
                                }

                                string content = prot.Content;

                                List<UserContext>? authors = [];
                                if (prot.Authors == null) // Author not specified, it means the author is the claimId
                                {
                                    authors = [ ctx.TryGetUserFromId(claimId) ];
                                }
                                else
                                {
                                    foreach (var author in prot.Authors) // In case of co-fronting, a message can have multiple authors, we need to validate each of them
                                    {
                                        UserContext? targetUser = null;
                                        var prefix = prot.Content.Split(' ')[0].ToLowerInvariant();
                                        targetUser = ctx.GetUsersFromPrefix(prefix).FirstOrDefault(x => ctx.DoesUserFillClaim(claimId, x.Id));
                                        if (targetUser != null) // We found a valid matching user with the prefix
                                        {
                                            content = prot.Content[prefix.Length..].TrimStart(); // We remove the prefix from the message
                                        }
                                        else
                                        {
                                            if (!ctx.DoesUserFillClaim(claimId, author))
                                            {
                                                var ack = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new Acknowledge()
                                                {
                                                    Type = MessageType.Acknowledge,
                                                    Id = prot.Id,
                                                    IsError = true
                                                }, Option));
                                                await client.SendAsync(ack, WebSocketMessageType.Text, true, CancellationToken.None);
                                                authors = null;
                                                break;
                                            }
                                            targetUser = ctx.TryGetUserFromId(author);
                                        }
                                        authors.Add(targetUser);
                                    }
                                }

                                if (authors == null) continue; // Authors is set to null only in case of an error
                                
                                _logger.Log(LogLevel.Information, $"Received message of size {content.Length} by {string.Join(", ", authors.Select(x => x.Username))}");

                                // Save to db
                                ContextInterpreter.Get(_dbContext).AddMessage(prot.ServerId, prot.ChannelId, new()
                                {
                                    CreationTime = now,
                                    Authors = authors.Select(x => x.Id).ToArray(),
                                    Message = content
                                });
                                var d = now.ToUniversalTime() - DateTime.UnixEpoch;
                                prot.SentAt = (long)Math.Floor(d.TotalSeconds);
                                prot.Authors = authors.Select(x => x.Id).ToArray();
                                if (content != prot.Content)
                                {
                                    prot.Content = content;
                                }

                                // Send message back
                                List<Task> tasks = [];
                                lock (_sockets)
                                {
                                    foreach (var s in _sockets.Where(x => x.WebSocket != client && ctx.CanAccessServer(prot.ServerId, x.ClaimId))) // Send the message to every users
                                    {
                                        var msg = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(prot, Option));
                                        Task t = s.WebSocket.SendAsync(msg, WebSocketMessageType.Text, true, CancellationToken.None);
                                        tasks.Add(t);
                                    }
                                    { // Send an acknowledgment to the user that sent it
                                        var ack = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new Acknowledge()
                                        {
                                            Type = MessageType.Acknowledge,
                                            Id = prot.Id,
                                            IsError = false,
                                            Content = prot.Content,
                                            Authors = prot.Authors
                                        }, Option));
                                        Task t = client.SendAsync(ack, WebSocketMessageType.Text, true, CancellationToken.None);
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
                            else
                            {
                                throw new NotImplementedException($"Unknown message {baseMsg.Type}");
                            }
                        }
                        catch (Exception e)
                        {
                            _logger.LogError(e.ToString());
                        }
                    }
                    else if (response.MessageType == WebSocketMessageType.Close)
                    {
                        lock (_sockets)
                        {
                            _sockets.RemoveAll(x => x.WebSocket == client);
                        }
                        break;
                    }
                }
            }
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            }
        }
    }

    internal class ContextUser
    {
    }
}
