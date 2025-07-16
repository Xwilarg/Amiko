using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Server.Database.Context;

public class InvitationContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public string Id { set; get; }
}