using Amiko.Server.Database;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/export/")]
public class ExportController : ControllerBase
{
    private readonly ILogger<WebsocketController> _logger;
    private SqliteContext _dbContext;
    private UserManager _userManager;

    public ExportController(ILogger<WebsocketController> logger, SqliteContext dbContext, UserManager userManager)
    {
        _logger = logger;
        _dbContext = dbContext;
        _userManager = userManager;
    }

    [Authorize]
    [HttpGet("{servId}/{chanId}")]
    public IActionResult ValidateToken([Required] int servId, [Required] int chanId)
    {
        var ctx = ContextInterpreter.Get(_dbContext);
        StringBuilder str = new();
        str.AppendLine($"# {ctx.GetServerName(servId)}");
        str.AppendLine($"## {ctx.GetChannelName(servId, chanId)}");

        var msgs = ctx.GetMessages(servId, chanId, int.MaxValue);
        foreach (var msg in msgs)
        {
            var dateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            dateTime = dateTime.AddSeconds(msg.SentAt.Seconds);
            str.AppendLine($"### [{dateTime:yyyy/MM/dd HH:mm:ss}] {_userManager.GetUserFromId(msg.Author, null, out var _)?.Username ?? "deleted"}");
            str.AppendLine(msg.Content);
            str.AppendLine();
        }

        return Content(str.ToString(), "text/plain");
    }
}
