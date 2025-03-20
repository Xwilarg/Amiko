using Amiko.Server.Database;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/auth/")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private SqliteContext _dbContext;

    public AuthController(ILogger<AuthController> logger, SqliteContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    [HttpPost("token")]
    public IActionResult GetToken([FromBody] string password)
    {
        var user = ContextInterpreter.Get(_dbContext).TryGetUserFromPassword(password, "Effy");

        if (user == null)
        {
            return StatusCode(StatusCodes.Status401Unauthorized, "This user does no exist");
        }

        var data = Encoding.UTF8.GetBytes("EffyILoveYouButPleaseINeedABetterPassword");
        var securityKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(data);

        var claims = new List<Claim>
        {
            new(ClaimTypes.UserData, user.Id.ToString())
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
        return StatusCode(StatusCodes.Status200OK);
    }
}
