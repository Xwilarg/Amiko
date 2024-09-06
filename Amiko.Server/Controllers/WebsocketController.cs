using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
using System.Text;

namespace Amiko.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WebsocketController : ControllerBase
    {
        private readonly ILogger<WebsocketController> _logger;

        public WebsocketController(ILogger<WebsocketController> logger)
        {
            _logger = logger;
        }

        private static readonly List<WebSocket> _sockets = new();

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

                while (true)
                {
                    var buffer = new byte[1024];
                    var response = await client.ReceiveAsync(buffer, CancellationToken.None);

                    if (response.MessageType == WebSocketMessageType.Binary)
                    {
                        _logger.Log(LogLevel.Information, $"Message received of size {buffer.Length}");

                        List<Task> tasks = [];
                        lock (_sockets)
                        {
                            foreach (var s in _sockets)
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
