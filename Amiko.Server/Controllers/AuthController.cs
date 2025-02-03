using Amiko.Server.Services;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/auth/")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private UserManager _userManager;

    public AuthController(ILogger<AuthController> logger, UserManager userManager)
    {
        _logger = logger;
        _userManager = userManager;
    }

    private string HashPassword(string password, string salt)
    {
        var saltBytes = Encoding.ASCII.GetBytes(salt);
        var hash = KeyDerivation.Pbkdf2(password, saltBytes, KeyDerivationPrf.HMACSHA512, 210000, 256 / 8);

        return Convert.ToHexString(hash).ToLower();
    }

    [HttpPost("token")]
    public IActionResult GetToken([FromBody] string password)
    {
        var hashed = HashPassword(password, "Effy");
        var user = _userManager.GetUserFromPassword(hashed);

        if (user == null)
        {
            return StatusCode(StatusCodes.Status401Unauthorized, "This user does no exist");
        }

        var data = Encoding.UTF8.GetBytes("EffyIsLoveYouButPleaseINeedABetterPassword");
        var securityKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(data);

        var claims = new List<Claim>
        {
            new(ClaimTypes.UserData, user.Id)
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
}
