using Amiko.Database.Context;
using Amiko.Database.Queries;
using Amiko.Server.Models;
using Amiko.Server.Models.Message;
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
            var servers = ServerQuery.GetServers(_dbContext, claimId, 50, ServerIncludes.IncludesAttachments);
            if (claimId == null && (!servers.Any() || !servers.Any(x => x.AllowsGuest)))
            {
                return; // Guest account but not server allowing guests
            }

            var client = await HttpContext.WebSockets.AcceptWebSocketAsync("client");
            lock (_connManager.Sockets)
            {
                _connManager.Sockets.Add(new() { WebSocket = client, ClaimId = claimId, IsAdmin = isAdmin });
            }

            // First connection from user!
            _logger.Log(LogLevel.Information, $"New client connected ({claimId})");
            // Send information about all servers existing
            await _connManager.SendMessageAsync(client, new ArrayMessage<ServerInfoMessage>()
            {
                Data = servers.Select(x => ServerInfoMessage.From(x, claimId == null ? null : UserQuery.GetUser(_dbContext, claimId.Value, UserIncludes.IncludesLastSeen))).ToArray()
            });

            // Send information about all users existing
            await _connManager.SendMessageAsync(client, new ArrayMessage<UserInfoMessage>()
            {
                Data = UserQuery.GetUsers(_dbContext, UserIncludes.IncludesLastSeen).Select(x => UserInfoMessage.From(x, claimId)).ToArray()
            });

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
                                var prot = JsonSerializer.Deserialize<SeenUpdateMessage>(Encoding.UTF8.GetString(buffer), _options);
                                UserQuery.UpdateLastSeen(_dbContext, prot.ServerId, prot.ChannelId, claimId.Value, DateTimeOffset.UtcNow.ToUnixTimeSeconds());
                            }
                        }
                        else if (baseMsg.Type == MessageType.Message)
                        {
                            // Parse actual message
                            var prot = JsonSerializer.Deserialize<MessageInfo>(Encoding.UTF8.GetString(buffer), _options);

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
                                await _connManager.SendMessageAsync(client, new AcknowledgeMessage()
                                {
                                    AckId = prot.AckId,
                                    IsError = true
                                });
                                continue;
                            }

                            _logger.Log(LogLevel.Information, $"Received message of size {updatedData.Content.Length} by {string.Join(", ", updatedData.Authors.Select(x => x.Username))}");

                            // Save to db
                            var finalId = MessageQuery.AddMessage(_dbContext, prot.ServerId, prot.ChannelId, claimId, now, updatedData.Content, updatedData.Authors.Select(x => x.Id).ToArray());

                            var authorsIds = updatedData.Authors.Select(x => x.Id).ToArray();
                            bool wereAuthorsUpdated = prot.Authors == null || !Enumerable.SequenceEqual(prot.Authors, authorsIds);
                            bool wasContentUpdated = prot.Content != updatedData.Content;

                            // Update message data with actual values
                            var d = now - DateTime.UnixEpoch;
                            prot.SentAt = (long)Math.Floor(d.TotalSeconds);
                            prot.Id = finalId;
                            prot.Attachments = [];
                            if (wereAuthorsUpdated) prot.Authors = authorsIds;
                            if (wasContentUpdated) prot.Content = updatedData.Content;

                            // Send message back
                            await _connManager.BroadcastMessageAsync(_dbContext, prot.ServerId, prot, client);
                            await _connManager.SendTo(_dbContext, new AcknowledgeMessage()
                            {
                                AckId = prot.AckId,
                                NewId = finalId,
                                IsError = false,
                                Content = wasContentUpdated ? prot.Content : null,
                                Authors = wereAuthorsUpdated ? prot.Authors : null,
                            }, client);
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
