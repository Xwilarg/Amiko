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
            await _connManager.BroadcastMessageAsync(_dbContext, null, msg);
        }
        return StatusCode(StatusCodes.Status204NoContent);
    }
}
