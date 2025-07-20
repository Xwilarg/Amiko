using Amiko.Server.Database.Context;
using Amiko.Server.Database.Dao;
using Amiko.Server.Models;
using Amiko.Server.Models.Response;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace Amiko.Server.Controllers
{
    [ApiController]
    [Route("/ws")]
    public class WebsocketController : ControllerBase
    {
        private readonly ILogger<WebsocketController> _logger;
        private SqliteContext _dbContext;
        private HttpClient _httpClient;
        private ConnectionManager _connManager;
        private MessageManager _msgManager;
        private JsonSerializerOptions _options;

        public WebsocketController(
            ILogger<WebsocketController> logger,
            SqliteContext dbContext,
            HttpClient httpClient,
            ConnectionManager connManager,
            MessageManager msgManager,
            JsonSerializerOptions options)
        {
            _logger = logger;
            _dbContext = dbContext;
            _httpClient = httpClient;
            _connManager = connManager;
            _msgManager = msgManager;
            _options = options;
        }

        private async Task ListenInternalAsync(int? claimId, bool isAdmin)
        {
            var client = await HttpContext.WebSockets.AcceptWebSocketAsync("client");
            lock (_connManager.Sockets)
            {
                _connManager.Sockets.Add(new() { WebSocket = client, ClaimId = claimId, IsAdmin = isAdmin });
            }

            // First connection from user!
            _logger.Log(LogLevel.Information, $"New client connected ({claimId})");

            // Send information about all servers existing
            var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new ArrayMessage<ServerInfo>()
            {
                Type = MessageType.Array,
                Data = ServerQuery.GetServers(_dbContext, claimId, 50, ServerIncludes.IncludesAttachments).Select(x => ServerInfo.From(x, claimId == null ? null : UserQuery.GetUser(_dbContext, claimId.Value, UserIncludes.IncludesLastSeen))).ToArray()
            }, _options));
            await client.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);

            // Send information about all users existing
            bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new ArrayMessage<UserInfo>()
            {
                Type = MessageType.Array,
                Data =  UserQuery.GetUsers(_dbContext, UserIncludes.IncludesLastSeen).Select(x => UserInfo.From(x, claimId)).ToArray()
            }, _options));
            await client.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);

            while (true)
            {
                var buffer = new byte[4096];
                WebSocketReceiveResult? response;

                try
                {
                    response = await client.ReceiveAsync(buffer, CancellationToken.None);
                }
                catch (WebSocketException)
                {
                    lock (_connManager.Sockets)
                    {
                        _connManager.Sockets.RemoveAll(x => x.WebSocket == client);
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
                        var baseMsg = JsonSerializer.Deserialize<BaseMessage>(Encoding.UTF8.GetString(buffer), _options);

                        if (baseMsg.Type == MessageType.Heartbeat)
                        { // Heartbeat, we just send one back
                            await client.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
                        }
                        else if (baseMsg.Type == MessageType.SeenUpdate)
                        {
                            if (claimId != null)
                            {
                                // Seen update, we update the db
                                var prot = JsonSerializer.Deserialize<SeenUpdate>(Encoding.UTF8.GetString(buffer), _options);
                                UserQuery.UpdateLastSeen(_dbContext, prot.ServerId, prot.ChannelId, claimId.Value, DateTimeOffset.UtcNow.ToUnixTimeSeconds());
                            }
                        }
                        else if (baseMsg.Type == MessageType.Message)
                        {
                            // Parse actual message
                            var prot = JsonSerializer.Deserialize<Message>(Encoding.UTF8.GetString(buffer), _options);

                            if (claimId == null)
                            {
                                if (!ServerQuery.CanAccessServer(_dbContext, prot.ServerId, claimId)) // Can we access the server as a guest?
                                {
                                    continue;
                                }
                            }
                            else if (!UserQuery.UpdateLastSeen(_dbContext, prot.ServerId, prot.ChannelId, claimId.Value, DateTimeOffset.UtcNow.ToUnixTimeSeconds()))
                            {
                                // If this fail, it means we don't have the permissions to view this channel
                                continue;
                            }

                            var updatedData = claimId == null
                                ? new MessageManager.UpdatedContent() { Authors = [], Content = prot.Content }
                                : _msgManager.ParseMessage(prot.Content, prot.Authors, claimId.Value);

                            if (updatedData == null)
                            {
                                var ack = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new Acknowledge()
                                {
                                    Type = MessageType.Acknowledge,
                                    AckId = prot.AckId,
                                    IsError = true
                                }, _options));
                                await client.SendAsync(ack, WebSocketMessageType.Text, true, CancellationToken.None);
                                continue;
                            }

                            _logger.Log(LogLevel.Information, $"Received message of size {updatedData.Content.Length} by {string.Join(", ", updatedData.Authors.Select(x => x.Username))}");

                            // Save to db
                            var finalId = MessageQuery.AddMessage(_dbContext, prot.ServerId, prot.ChannelId, claimId, new()
                            {
                                CreationTime = now,
                                Authors = updatedData.Authors.Select(x => x.Id).ToArray(),
                                Message = updatedData.Content
                            });

                            var authorsIds = updatedData.Authors.Select(x => x.Id).ToArray();
                            bool wereAuthorsUpdated = prot.Authors == null || !Enumerable.SequenceEqual(prot.Authors, authorsIds);
                            bool wasContentUpdated = prot.Content != updatedData.Content;

                            // Update message data with actual values
                            var d = now.ToUniversalTime() - DateTime.UnixEpoch;
                            prot.SentAt = (long)Math.Floor(d.TotalSeconds);
                            prot.Id = finalId;
                            prot.Attachments = [];
                            if (wereAuthorsUpdated) prot.Authors = authorsIds;
                            if (wasContentUpdated) prot.Content = updatedData.Content;

                            // Send message back
                            List<Task> tasks = [];
                            lock (_connManager.Sockets)
                            {
                                // Connected users
                                foreach (var s in _connManager.Sockets.Where(x => x.WebSocket != client && ServerQuery.CanAccessServer(_dbContext, prot.ServerId, x.ClaimId))) // Send the message to every users
                                {
                                    var msg = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(prot, _options));
                                    Task t = s.WebSocket.SendAsync(msg, WebSocketMessageType.Text, true, CancellationToken.None);
                                    tasks.Add(t);
                                }
                                { // Send an acknowledgment to the user that sent it
                                    var ack = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new Acknowledge()
                                    {
                                        Type = MessageType.Acknowledge,
                                        AckId = prot.AckId,
                                        NewId = finalId,
                                        IsError = false,
                                        Content = wasContentUpdated ? prot.Content : null,
                                        Authors = wereAuthorsUpdated ? prot.Authors : null,
                                    }, _options));
                                    Task t = client.SendAsync(ack, WebSocketMessageType.Text, true, CancellationToken.None);
                                    tasks.Add(t);
                                }
                                // Webhooks
                                foreach (var hook in UserQuery.GetServerWebhooks(_dbContext, prot.ServerId, UserIncludes.None))
                                {
                                    Task t = _httpClient.PostAsJsonAsync(hook.Webhook, new WebhookInfo() { Content = prot.Content, Username = string.Join(", ", updatedData.Authors.Select(x => x.Username)) }, _options);
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
                    lock (_connManager.Sockets)
                    {
                        _connManager.Sockets.RemoveAll(x => x.WebSocket == client);
                    }
                    break;
                }
            }
        }

        [Route("guest")]
        public async Task GetGuest()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                await ListenInternalAsync(null, false);
            }
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            }
        }

        [Route(""), Authorize]
        public async Task Get()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                // Info of who sent the msg
                var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);
                var isAdmin = (User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.Role).Value.Split(",").Contains("Admin");

                await ListenInternalAsync(claimId, isAdmin);
            }
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            }
        }
    }
}
