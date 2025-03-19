using Amiko.Models;
using Amiko.Server.Database;
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
    [Route("[controller]")]
    public class WebsocketController : ControllerBase
    {
        private readonly ILogger<WebsocketController> _logger;
        private SqliteContext _dbContext;
        private UserManager _userManager;

        public WebsocketController(ILogger<WebsocketController> logger, SqliteContext dbContext, UserManager userManager)
        {
            _logger = logger;
            _dbContext = dbContext;
            _userManager = userManager;
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

        private static readonly List<WebSocket> _sockets = [];

        [Route("/ws"), Authorize]
        public async Task Get()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                var client = await HttpContext.WebSockets.AcceptWebSocketAsync("client");
                lock (_sockets)
                {
                    _sockets.Add(client);
                }

                // Info of who sent the msg
                var claimId = (User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value;
                var authorId = _userManager.GetUserFromId(claimId, null, out var _).Id;

                // First connection from user!
                _logger.Log(LogLevel.Information, $"New client connected ({authorId})");

                // Send information about all servers existing
                var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new ArrayMessage<ServerInfo>()
                {
                    Type = MessageType.Array,
                    Data = ContextInterpreter.Get(_dbContext).GetStartingInfo(50)
                }, Option));
                await client.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);

                // Send information about all users existing
                bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new ArrayMessage<UserInfo>()
                {
                    Type = MessageType.Array,
                    Data = _userManager.GetAllUsersInfo(claimId, authorId)
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
                            _sockets.Remove(client);
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
                            else if (baseMsg.Type == MessageType.Message)
                            {
                                // Parse actual message
                                var prot = JsonSerializer.Deserialize<Message>(Encoding.UTF8.GetString(buffer), Option);

                                var prefix = prot.Content.Split(' ')[0];
                                authorId = _userManager.GetUserFromId(claimId, prot.Content.Length > prefix.Length ? prefix : null, out var isPrefixed).Id;

                                string content = isPrefixed ? prot.Content[(prefix.Length + 1)..] : prot.Content;

                                _logger.Log(LogLevel.Information, $"Received {content} by {authorId}");

                                // Save to db
                                ContextInterpreter.Get(_dbContext).AddMessage(prot.ServerId, prot.ChannelId, new()
                                {
                                    CreationTime = now,
                                    AuthorId = authorId,
                                    Message = content
                                });
                                var d = now.ToUniversalTime() - DateTime.UnixEpoch;
                                prot.SentAt = new()
                                {
                                    Seconds = (long)Math.Floor(d.TotalSeconds),
                                    Nanos = d.Nanoseconds
                                };
                                prot.Author = authorId;
                                prot.Content = content;

                                // Send message back
                                List<Task> tasks = [];
                                lock (_sockets)
                                {
                                    foreach (var s in _sockets.Where(x => x != client)) // Send the message to every users
                                    {
                                        var msg = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(prot, Option));
                                        Task t = s.SendAsync(msg, WebSocketMessageType.Text, true, CancellationToken.None);
                                        tasks.Add(t);
                                    }
                                    { // Send an acknowledgment to the user that sent it
                                        var ack = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new Acknowledge()
                                        {
                                            Type = MessageType.Acknowledge,
                                            Id = prot.Id,
                                            IsError = false,
                                            Author = isPrefixed ? authorId : null,
                                            Content = isPrefixed ? content : null
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
                            _sockets.Remove(client);
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
}
