using Amiko.Server.Database;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/export/")]
public class ExportController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
        private SqliteContext _dbContext;

    public ExportController(ILogger<AuthController> logger, SqliteContext dbContext)
    {
        _logger = logger;
            _dbContext = dbContext;
    }

    [Authorize]
    [HttpGet("{servId}/{chanId}")]
    public IActionResult ValidateToken([Required] int servId, [Required] int chanId)
    {
        var ctx = ContextInterpreter.Get(_dbContext);
        StringBuilder str = new();
        str.AppendLine($"# {ctx.GetServerName(servId)}");
        str.AppendLine($"## {ctx.GetChannelName(servId, chanId)}");

        var resp = new HttpResponseMessage(HttpStatusCode.OK);
        resp.Content = new StringContent(result, Encoding.UTF8, "text/plain");
        return StatusCode(StatusCodes.Status200OK, null);
    }
}
