using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Server.Database.Context;

/// <summary>
/// Pending invitation to join an Amiko instance
/// </summary>
public class InvitationContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public string Id { set; get; }
}