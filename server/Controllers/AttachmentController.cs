using Amiko.Models;
using Amiko.Server.Database;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/attachment/")]
public class AttachmentController : ControllerBase
{
    private readonly ILogger<WebsocketController> _logger;
    private SqliteContext _dbContext;
    private ConnectionManager _connManager;

    public AttachmentController(ILogger<WebsocketController> logger, SqliteContext dbContext, ConnectionManager connManager)
    {
        _logger = logger;
        _dbContext = dbContext;
        _connManager = connManager;
    }

    [Authorize]
    [HttpPost("attach/{msgId}")]
    [RequestSizeLimit(2_000_000)]
    public async Task<IActionResult> AddAttachment([Required] int msgId, [Required, FromForm] IFormFile[] files)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);
        var ctx = ContextInterpreter.Get(_dbContext);

        if (files.Length > 1)
        {
            return StatusCode(StatusCodes.Status400BadRequest, "Multiple attachment isn't supported yet");
        }

        using var ms = new MemoryStream();
        files[0].CopyTo(ms);
        var id = ctx.TryAddAttachment(msgId, claimId, files[0].FileName, ms.ToArray());
        if (id == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        await _connManager.PropagateAttachment(msgId, [ new AttachmentInfo() { Id = id.Value, Name = files[0].FileName } ]);

        return StatusCode(StatusCodes.Status200OK);
    }
}
