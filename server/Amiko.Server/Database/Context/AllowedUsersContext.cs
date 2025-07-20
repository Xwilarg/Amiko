using System.ComponentModel.DataAnnotations;

namespace Amiko.Server.Database.Context;

/// <summary>
/// Represents a list of users that were allowed in a server
/// </summary>
public class AllowedUsersContext
{
    public int ServerId { set; get; }
    public int UserId { set; get; }
}

