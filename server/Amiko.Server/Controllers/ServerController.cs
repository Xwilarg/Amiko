using Amiko.Database.Context;
using Amiko.Database.Queries;
using Amiko.Server.Models.Message;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/server/")]
public class ServerController : ControllerBase
{
    private readonly ILogger<ServerController> _logger;
    private SqliteContext _dbContext;
    private ConfigManager _configManager;
    private ConnectionManager _connManager;

    public ServerController(ILogger<ServerController> logger, SqliteContext dbContext, ConfigManager configManager, ConnectionManager connManager)
    {
        _logger = logger;
        _dbContext = dbContext;
        _configManager = configManager;
        _connManager = connManager;
    }

    [HttpPost("update/{servId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateServer(int servId, [FromBody] ServerUpdateMessage msg)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

        if (ServerQuery.UpdateServer(_dbContext, servId, claimId, msg.Color, msg.Character, msg.Name, msg.AllowsGuest, msg.IsEphemeral))
        {
            msg.Id = servId;
            msg.UpdateType = UpdateType.Edition;
            await _connManager.BroadcastMessageAsync(_dbContext, null, msg);
            return StatusCode(StatusCodes.Status200OK);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }

    [HttpPost("create")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateServer()
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

        var s = ServerQuery.AddServer(_dbContext, "New Server");
        if (s != -1)
        {
            var sMsg = new ServerUpdateMessage()
            {
                Id = s,
                Name = "New Server",
                Color = new Database.Color() { R = 54, G = 54, B = 54 },
                Character = "N",
                UpdateType = UpdateType.Creation
            };
            await _connManager.BroadcastMessageAsync(_dbContext, null, sMsg);
            
            var c = ChannelQuery.AddChannel(_dbContext, claimId, s, "New Channel");
            if (c != -1)
            {
                var cMsg = new ChannelUpdateMessage()
                {
                    ServId = s,
                    ChanId = c,
                    Name = "New Channel",
                    UpdateType = UpdateType.Creation
                };
                await _connManager.BroadcastMessageAsync(_dbContext, s, cMsg);
            }
            return StatusCode(StatusCodes.Status200OK);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }

    [HttpDelete("delete/{servId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteServer(int servId)
    {
        if (ServerQuery.DeleteServer(_dbContext, servId))
        {
            var msg = new ServerUpdateMessage()
            {
                Id = servId,
                UpdateType = UpdateType.Deletion
            };
            await _connManager.BroadcastMessageAsync(_dbContext, null, msg);
            return StatusCode(StatusCodes.Status200OK);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }
}
