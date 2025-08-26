using Amiko.Database.Context;
using Amiko.Database.Queries;
using Amiko.Server.Models.Message;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/channel/")]
public class ChannelController : ControllerBase
{
    private readonly ILogger<ServerController> _logger;
    private SqliteContext _dbContext;
    private ConfigManager _configManager;
    private ConnectionManager _connManager;

    public ChannelController(ILogger<ServerController> logger, SqliteContext dbContext, ConfigManager configManager, ConnectionManager connManager)
    {
        _logger = logger;
        _dbContext = dbContext;
        _configManager = configManager;
        _connManager = connManager;
    }

    [HttpPatch("{servId}/{chanId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateChannel(int servId, int chanId, [FromBody] ChannelUpdateMessage msg)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

        if (ChannelQuery.UpdateChannel(_dbContext, claimId, servId, chanId, msg.Name))
        {
            msg.ServId = servId;
            msg.ChanId = chanId;
            msg.UpdateType = UpdateType.Edition;
            await _connManager.BroadcastMessageAsync(_dbContext, servId, msg, except: null);
            return StatusCode(StatusCodes.Status204NoContent);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }

    [HttpPost("{servId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateChannel(int servId)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

        var id = ChannelQuery.AddChannel(_dbContext, claimId, servId, "New Channel");
        if (id != -1)
        {
            var msg = new ChannelUpdateMessage()
            {
                ServId = servId,
                ChanId = id,
                Name = "New Channel",
                UpdateType = UpdateType.Creation
            };
            await _connManager.BroadcastMessageAsync(_dbContext, servId, msg, except: null);
            return StatusCode(StatusCodes.Status204NoContent);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }

    [HttpDelete("{servId}/{chanId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteChannel(int servId, int chanId)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

        if (ChannelQuery.DeleteChannel(_dbContext, claimId, servId, chanId))
        {
            var msg = new ChannelUpdateMessage()
            {
                ServId = servId,
                ChanId = chanId,
                UpdateType = UpdateType.Deletion
            };
            await _connManager.BroadcastMessageAsync(_dbContext, servId, msg, except: null);
            return StatusCode(StatusCodes.Status204NoContent);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }
}
