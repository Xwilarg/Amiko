using System.ComponentModel.DataAnnotations;

namespace Amiko.Database.Context;

/// <summary>
/// Represents a list of users that were allowed in a server
/// </summary>
internal class AllowedUsersContext
{
    public int ServerId { set; get; }
    public int UserId { set; get; }
}

