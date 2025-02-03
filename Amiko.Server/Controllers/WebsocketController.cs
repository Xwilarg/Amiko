using Amiko.Common;
using Amiko.Server.Database;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
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

                // First connection: send all messages
                _logger.Log(LogLevel.Information, $"New client connected");
                var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(ContextInterpreter.Get(_dbContext).AllMessages(), Option));
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

                        // Parse actual message
                        _logger.Log(LogLevel.Information, $"Received {Encoding.UTF8.GetString(buffer)}");
                        var prot = JsonSerializer.Deserialize<Message>(Encoding.UTF8.GetString(buffer), Option);

                        try
                        {
                            _logger.Log(LogLevel.Information, $"{prot.Content} by {prot.Name}");

                            // Save to db
                            ContextInterpreter.Get(_dbContext).AddMessage(new()
                            {
                                CreationTime = now,
                                Username = prot.Name,
                                Message = prot.Content
                            });
                            var d = now.ToUniversalTime() - DateTime.UnixEpoch;
                            prot.SentAt = new()
                            {
                                Seconds = (long)Math.Floor(d.TotalSeconds),
                                Nanos = d.Nanoseconds
                            };

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
                                    var ack = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new Acknowledge() { Type = MessageType.Acknowledge, Id = prot.Id, IsError = false }, Option));
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
                        catch
                        {
                            var ack = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new Acknowledge() { Type = MessageType.Acknowledge, Id = prot.Id, IsError = true }, Option));
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
