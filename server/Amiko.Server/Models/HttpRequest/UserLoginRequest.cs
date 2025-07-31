using System.ComponentModel.DataAnnotations;

namespace Amiko.Server.Models.HttpRequest;

public class UserLoginRequest
{
    [Required]
    public required string Username { set; get; }
    [Required]
    public required string Password { set; get; }
}
