using Amiko.Server.Database;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Http.Headers;
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
            str.AppendLine($"### [{msg.SentAt:yyyy/MM/dd HH:mm:ss}] {_userManager.GetUserFromId(msg.Author)?.Username ?? "deleted"}");
            str.AppendLine(msg.Content);
            str.AppendLine();
        }

        return Content(str.ToString(), "text/plain");
    }
}
