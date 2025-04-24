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
    [HttpGet("get/{servId}/{chanId}/{msgId}")]
    public async Task<IActionResult> GetAttachment([Required] int servId, [Required] int chanId, [Required] int msgId)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);
        var ctx = ContextInterpreter.Get(_dbContext);

        var att = ctx.TryGetAttachment(servId, chanId, msgId, claimId);
        if (att.Count == 0)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var file = att[0];
        var cd = new System.Net.Mime.ContentDisposition
        {
            FileName = file.Filename,
            Inline = true,
        };

        Response.Headers.Append("Content-Disposition", cd.ToString());

        return File(file.Data, file.Mimetype);
    }

    [HttpGet("getGuest/{servId}/{chanId}/{msgId}")]
    public async Task<IActionResult> GetAttachmentGuest([Required] int servId, [Required] int chanId, [Required] int msgId)
    {
        var ctx = ContextInterpreter.Get(_dbContext);

        var att = ctx.TryGetAttachment(servId, chanId, msgId, null);
        if (att.Count == 0)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var file = att[0];
        var cd = new System.Net.Mime.ContentDisposition
        {
            FileName = file.Filename,
            Inline = true,
        };

        Response.Headers.Append("Content-Disposition", cd.ToString());

        return File(file.Data, file.Mimetype);
    }

    [Authorize]
    [HttpPost("attach/{servId}/{chanId}/{msgId}")]
    [RequestSizeLimit(2_000_000)]
    public async Task<IActionResult> AddAttachment([Required] int servId, [Required] int chanId, [Required] int msgId, [Required, FromForm] IFormFile[] files)
    {
        var claimId = int.Parse((User.Identity as ClaimsIdentity).FindFirst(x => x.Type == ClaimTypes.UserData).Value);
        var ctx = ContextInterpreter.Get(_dbContext);

        if (files.Length == 0)
        {
            return StatusCode(StatusCodes.Status400BadRequest, "At least one file must be submitted");
        }
        if (files.Length > 1)
        {
            return StatusCode(StatusCodes.Status400BadRequest, "Multiple attachment isn't supported yet");
        }

        using var ms = new MemoryStream();
        files[0].CopyTo(ms);
        var id = ctx.TryAddAttachment(servId, chanId, msgId, claimId, files[0].FileName, files[0].ContentType, ms.ToArray());
        if (id == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        await _connManager.PropagateAttachment(msgId, [ new AttachmentInfo() { Id = id.Value, Name = files[0].FileName } ]);

        return StatusCode(StatusCodes.Status204NoContent);
    }
}
