using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Server.Database.Context;


/// <summary>
/// Represent information of when was a channel seen by a specific user
/// </summary>
public class ChannelSeen
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    public int ServId { set; get; }
    public int ChanId { set; get; }
    public long LastSeen { set; get; }
}