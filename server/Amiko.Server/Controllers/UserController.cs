using Amiko.Database.Context;
using Amiko.Database.Queries;
using Amiko.Server.Models.Message;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/user/")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;
    private SqliteContext _dbContext;
    private ConfigManager _configManager;
    private ConnectionManager _connManager;

    public UserController(ILogger<UserController> logger, SqliteContext dbContext, ConfigManager configManager, ConnectionManager connManager)
    {
        _logger = logger;
        _dbContext = dbContext;
        _configManager = configManager;
        _connManager = connManager;
    }

    [HttpPost("update")]
    [Authorize]
    public async Task<IActionResult> UpdateUser([FromBody] UserMessage msg)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

        if (UserQuery.DoesUserFillClaim(_dbContext, claimId, msg.Id))
        {
            if (UserQuery.UpdateUser(_dbContext, msg.Id, msg.Color, msg.Character, msg.Username))
            {
                msg.Type = MessageType.UserInfo;
                await _connManager.BroadcastMessageAsync(_dbContext, null, msg);
            }
            return StatusCode(StatusCodes.Status204NoContent);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }
}
