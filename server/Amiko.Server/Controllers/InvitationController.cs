using Amiko.Database.Context;
using Amiko.Database.Queries;
using Amiko.Server.Models.HttpRequest;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/invitation/")]
public class InvitationController : ControllerBase
{
    private readonly ILogger<InvitationController> _logger;
    private SqliteContext _dbContext;
    private ConfigManager _configManager;

    public InvitationController(ILogger<InvitationController> logger, SqliteContext dbContext, ConfigManager configManager)
    {
        _logger = logger;
        _dbContext = dbContext;
        _configManager = configManager;
    }

    [HttpPost("create")]
    [Authorize]
    public async Task<IActionResult> CreateInvitation()
    {
        var code = InvitationQuery.CreateInvitation(_dbContext, false);
        return StatusCode(StatusCodes.Status200OK, code);
    }

    [HttpPost("createAdmin")]
    public async Task<IActionResult> CreateInvitation([FromBody] InvitationCreationRequest creationInfo)
    {
        if (creationInfo.AdminToken == _configManager.GetConfig().AdminKey)
        {
            var code = InvitationQuery.CreateInvitation(_dbContext, creationInfo.IsAdmin);
            return StatusCode(StatusCodes.Status200OK, code);
        }
        return StatusCode(StatusCodes.Status401Unauthorized);
    }

    [HttpPost("createUser")]
    public async Task<IActionResult> CreateUser([FromBody] UserCreationRequest creationInfo)
    {
        var isFirstUser = InvitationQuery.GetInvitation(_dbContext, creationInfo.Invitation).IsAdmin && !UserQuery.GetUsers(_dbContext, UserIncludes.None).Any();

        var res = InvitationQuery.CreateUserFromInvitation(_dbContext, creationInfo.Invitation, creationInfo.Username, creationInfo.Password);
        if (res)
        {
            if (isFirstUser) // We automatically create a server and channel along the first user
            {
                var id = ServerQuery.AddServer(_dbContext, $"{creationInfo.Username}'s server");
                ChannelQuery.AddChannel(_dbContext, id, "General");

                // Since this is the first user and he isn't connected yet, there is no use to propagate the creation because he'll get the info when login-in
            }
            return StatusCode(StatusCodes.Status204NoContent);
        }
        return StatusCode(StatusCodes.Status400BadRequest);
    }

    [HttpPost("isValid")]
    public async Task<IActionResult> IsValid(string code)
    {
        return StatusCode(StatusCodes.Status200OK, InvitationQuery.IsInvitationValid(_dbContext, code) ? 1 : 0);
    }
}
