using Amiko.Common;
using Amiko.Server.Database;
using Microsoft.AspNetCore.Mvc;
using ProtoBuf;
using System.Net.WebSockets;

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

        private static readonly List<WebSocket> _sockets = [];

        [Route("/ws")]
        public async Task Get()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                var client = await HttpContext.WebSockets.AcceptWebSocketAsync();
                lock (_sockets)
                {
                    _sockets.Add(client);
                }

                // First connection: send all messages
                using MemoryStream oms = new();
                Serializer.Serialize(oms, ContextInterpreter.Get(_dbContext).AllMessages);
                await client.SendAsync(oms.ToArray(), WebSocketMessageType.Binary, true, CancellationToken.None);

                while (true)
                {
                    var buffer = new byte[1024];
                    var response = await client.ReceiveAsync(buffer, CancellationToken.None);

                    if (response.MessageType == WebSocketMessageType.Binary)
                    {
                        _logger.Log(LogLevel.Information, $"Message received of size {buffer.Length}");

                        // Save to db
                        buffer = buffer.TakeWhile((v, index) => buffer.Skip(index).Any(w => w != 0x00)).ToArray(); // TODO: ew
                        using MemoryStream ms = new(buffer);
                        var prot = Serializer.Deserialize<Message>(ms);
                        ContextInterpreter.Get(_dbContext).AddMessage(new()
                        {
                            CreationTime = DateTime.Now,
                            Username = prot.Name,
                            Message = prot.Content
                        });

                        // Send message back
                        List<Task> tasks = [];
                        lock (_sockets)
                        {
                            foreach (var s in _sockets.Where(x => x != client))
                            {
                                Task t = s.SendAsync(buffer, WebSocketMessageType.Binary, true, CancellationToken.None);
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
