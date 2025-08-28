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

    [HttpPatch("{userId}")]
    [Authorize]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UserUpdateMessage msg)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity)!.FindFirst(x => x.Type == ClaimTypes.UserData)!.Value);

        if (UserQuery.DoesUserFillClaim(_dbContext, claimId, userId))
        {
            if (UserQuery.UpdateUser(_dbContext, userId, msg.Color, msg.Character, msg.Username, msg.Prefix))
            {
                msg.Id = userId;
                msg.UpdateType = UpdateType.Edition;
                await _connManager.BroadcastMessageAsync(_dbContext, null, msg, except: null);
            }
            return StatusCode(StatusCodes.Status204NoContent);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }

    [HttpPost("alt")]
    [Authorize]
    public async Task<IActionResult> CreateAltUser()
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity)!.FindFirst(x => x.Type == ClaimTypes.UserData)!.Value);

        var id = UserQuery.CreateAltUser(_dbContext, "New User", claimId);
        if (id != -1)
        {
            var msg = new UserUpdateMessage()
            {
                UpdateType = UpdateType.Creation,
                Id = id,
                DependsOf = claimId
            };
            await _connManager.BroadcastMessageAsync(_dbContext, null, msg, except: null);
            return StatusCode(StatusCodes.Status204NoContent);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }

    [HttpDelete("{userId}")]
    [Authorize]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity)!.FindFirst(x => x.Type == ClaimTypes.UserData)!.Value);

        if (UserQuery.DeleteUser(_dbContext, userId, claimId))
        {
            var msg = new UserUpdateMessage()
            {
                UpdateType = UpdateType.Deletion,
                Id = userId,
                DependsOf = claimId
            };
            await _connManager.BroadcastMessageAsync(_dbContext, null, msg, except: null);
            return StatusCode(StatusCodes.Status204NoContent);
        }
        return StatusCode(StatusCodes.Status403Forbidden);
    }
}
