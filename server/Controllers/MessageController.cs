using Amiko.Models;
using Amiko.Server.Database;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/message/")]
public class MessageController : ControllerBase
{
    private readonly ILogger<WebsocketController> _logger;
    private SqliteContext _dbContext;

    public MessageController(ILogger<WebsocketController> logger, SqliteContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
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

        await WebsocketController.PropagateAttachment(msgId, [ new AttachmentInfo() { Id = id.Value, Name = files[0].FileName } ]);

        return StatusCode(StatusCodes.Status200OK);
    }
}
