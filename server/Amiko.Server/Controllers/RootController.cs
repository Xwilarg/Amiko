using Amiko.Server.Database.Context;
using Amiko.Server.Database.Dao;
using Amiko.Server.Models.HttpResponse;
using Microsoft.AspNetCore.Mvc;

namespace Amiko.Server.Controllers;

[ApiController]
[Route("/api/")]
public class RootController : ControllerBase
{
    private readonly ILogger<RootController> _logger;
    private SqliteContext _dbContext;

    public RootController(ILogger<RootController> logger, SqliteContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    [HttpGet()]
    public IActionResult Get()
    {
        return StatusCode(StatusCodes.Status200OK, new InstanceInfo()
        {
            IsInit = UserQuery.GetUsers(_dbContext, UserIncludes.None).Any()
        });
    }
}
