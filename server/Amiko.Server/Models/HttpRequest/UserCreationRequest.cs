using System.ComponentModel.DataAnnotations;

namespace Amiko.Server.Models.HttpRequest;

public class UserCreationRequest
{
    [Required]
    public required string Invitation { set; get; }
    [Required]
    public required string Username { set; get; }
    [Required]
    public required string Password { set; get; }
}
