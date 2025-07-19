using Amiko.Server.Database.Context;
using Amiko.Server.Database.Queries;
using Amiko.Server.Models.HttpRequest;
using Amiko.Server.Models.Response;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

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
    public async Task<IActionResult> CreateInvitation([FromBody] InvitationCreationInfo creationInfo)
    {
        if (creationInfo.AdminToken == _configManager.GetConfig().AdminKey)
        {
            var code = InvitationQuery.CreateInvitation(_dbContext, creationInfo.IsAdmin);
            return StatusCode(StatusCodes.Status200OK, code);
        }
        return StatusCode(StatusCodes.Status401Unauthorized);
    }

    [HttpPost("createUser")]
    public async Task<IActionResult> CreateUser([FromBody] UserCreationInfo creationInfo)
    {
        var res = InvitationQuery.CreateUserFromInvitation(_dbContext, creationInfo.Invitation, creationInfo.Username, creationInfo.Password);
        if (res) return StatusCode(StatusCodes.Status204NoContent);
        return StatusCode(StatusCodes.Status400BadRequest);
    }

    [HttpPost("isValid")]
    public async Task<IActionResult> IsValid(string code)
    {
        return StatusCode(StatusCodes.Status200OK, InvitationQuery.IsInvitationValid(_dbContext, code) ? 1 : 0);
    }
}
