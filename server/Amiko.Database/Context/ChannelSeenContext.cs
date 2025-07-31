using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Database.Context;


/// <summary>
/// Represent information of when was a channel seen by a specific user
/// </summary>
internal class ChannelSeenContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    /// <summary>
    /// The server ID of the channel that was seen
    /// </summary>
    public int ServId { set; get; }
    /// <summary>
    /// The channel ID of the channel that was seen
    /// </summary>
    public int ChanId { set; get; }
    /// <summary>
    /// The last time this channel was seen
    /// </summary>
    public long LastSeen { set; get; }
}