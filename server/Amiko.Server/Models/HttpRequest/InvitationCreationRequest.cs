using System.ComponentModel.DataAnnotations;

namespace Amiko.Server.Models.HttpRequest;

public class InvitationCreationRequest
{
    [Required]
    public required string AdminToken { set; get; }
    [Required]
    public required bool IsAdmin { set; get; }
}
