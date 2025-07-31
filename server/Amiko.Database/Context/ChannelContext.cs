using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Database.Context;

/// <summary>
/// Represent a channel of conversation within a server
/// </summary>
internal class ChannelContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    /// <summary>
    /// Display name of the channel
    /// </summary>
    public string Name { set; get; }
    /// <summary>
    /// Short description of the channel
    /// </summary>
    public string? Description { set; get; }
    /// <summary>
    /// All messages sent in this channel
    /// </summary>
    public List<MessageContext> Messages { set; get; } = [];
}