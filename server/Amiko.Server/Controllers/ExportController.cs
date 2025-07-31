using Amiko.Database.Context;
using Amiko.Database.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/export/")]
public class ExportController : ControllerBase
{
    private readonly ILogger<WebsocketController> _logger;
    private SqliteContext _dbContext;

    public ExportController(ILogger<WebsocketController> logger, SqliteContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    [Authorize]
    [HttpGet("{servId}/{chanId}")]
    public IActionResult ValidateToken([Required] int servId, [Required] int chanId)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);

        var serv = ServerQuery.GetServer(_dbContext, servId, claimId, null, ServerIncludes.None);
        var chan = ChannelQuery.GetChannel(_dbContext, servId, chanId, claimId, null, ServerIncludes.IncludesAttachments);

        if (serv == null || chan == null || serv.IsEphemeral)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        StringBuilder str = new();
        str.AppendLine($"# {serv.Name}");
        str.AppendLine($"## {chan.Name}");

        foreach (var msg in chan.Messages)
        {
            str.AppendLine($"### [{msg.CreationTime:yyyy/MM/dd HH:mm:ss}] {string.Join(" / ", msg.Authors.Select(x => UserQuery.GetUser(_dbContext, x, UserIncludes.None)?.Username ?? "deleted"))}");
            str.AppendLine(msg.Message);
            str.AppendLine();
        }

        return Content(str.ToString(), "text/plain");
    }
}
