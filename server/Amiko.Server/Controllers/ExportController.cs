using Amiko.Server.Database.Context;
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
        var ctx = ContextInterpreter.Get(_dbContext);
        var serv = ctx.GetServer(servId, claimId);

        var chan = ctx.GetChannel(servId, chanId, claimId);

        if (serv == null || chan == null || serv.IsEphemeral)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        StringBuilder str = new();
        str.AppendLine($"# {serv.Name}");
        str.AppendLine($"## {chan.Name}");

        var msgs = ctx.GetMessages(servId, chanId, int.MaxValue);
        foreach (var msg in msgs)
        {
            var dateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            dateTime = dateTime.AddSeconds(msg.SentAt);
            str.AppendLine($"### [{dateTime:yyyy/MM/dd HH:mm:ss}] {string.Join(" / ", msg.Authors.Select(x => ctx.TryGetUserFromId(x)?.Username ?? "deleted"))}");
            str.AppendLine(msg.Content);
            str.AppendLine();
        }

        return Content(str.ToString(), "text/plain");
    }
}
