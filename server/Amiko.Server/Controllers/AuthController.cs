using Amiko.Server.Database.Context;
using Amiko.Server.Database.Dao;
using Amiko.Server.Models.HttpRequest;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/auth/")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private SqliteContext _dbContext;
    private ConfigManager _configManager;

    public AuthController(ILogger<AuthController> logger, SqliteContext dbContext, ConfigManager configManager)
    {
        _logger = logger;
        _dbContext = dbContext;
        _configManager = configManager;
    }

    [HttpPost("token")]
    public IActionResult GetToken([FromBody] UserLoginRequest loginData)
    {
        var user = UserQuery.GetUserFromPassword(_dbContext, loginData.Username, loginData.Password);

        if (user == null)
        {
            return StatusCode(StatusCodes.Status401Unauthorized, "This user does no exist");
        }

        var data = Encoding.UTF8.GetBytes(_configManager.GetConfig().SecurityKey);
        var securityKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(data);

        var claims = new List<Claim>
        {
            new(ClaimTypes.UserData, user.Id.ToString()),
            new(ClaimTypes.Role, user.IsAdmin ? "Admin" : string.Empty)
        };

        var algorithms = Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature;
        var credentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(securityKey, algorithms);

        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: credentials);

        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var tokenString = tokenHandler.WriteToken(token);

        return StatusCode(StatusCodes.Status200OK, tokenString);
    }

    [Authorize]
    [HttpPost("validate")]
    public IActionResult ValidateToken()
    {
        return StatusCode(StatusCodes.Status204NoContent);
    }
}
