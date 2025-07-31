using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Database.Context;

/// <summary>
/// Pending invitation to join an Amiko instance
/// </summary>
internal class InvitationContext
{
    [Key] public string Id { set; get; }

    /// <summary>
    /// Time after the invitation is no longer valid
    /// </summary>
    public DateTime ExpirationDate { set; get; }

    /// <summary>
    /// Will the invite create an admin account
    /// </summary>
    public bool IsAdmin { set; get; }
}