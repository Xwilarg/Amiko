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

    [HttpPost("update/{servId}/{chanId}")]
    [Authorize]
    public async Task<IActionResult> UpdateChannel(int servId, int chanId, [FromBody] ChannelUpdateMessage msg)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

        if (ChannelQuery.UpdateChannel(_dbContext, claimId, servId, chanId, msg.Name))
        {
            msg.ServId = servId;
            msg.ChanId = chanId;
            await _connManager.BroadcastMessageAsync(_dbContext, servId, msg);
        }
        return StatusCode(StatusCodes.Status204NoContent);
    }
}
