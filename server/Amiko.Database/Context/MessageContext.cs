using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Database.Context;

/// <summary>
/// Represent a message sent in a channel
/// </summary>
internal class MessageContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    /// <summary>
    /// Date at which the message was created
    /// </summary>
    public DateTime CreationTime { set; get; }

    /// <summary>
    /// Content of the message
    /// </summary>
    public string Message { set; get; }
    /// <summary>
    /// Authors of the messages
    /// Usually have only one, can have more if co-fronting feature is enabled
    /// </summary>
    public int[] Authors { set; get; }
    /// <summary>
    /// Files attached to the message
    /// </summary>
    public List<AttachmentContext> Attachments { set; get; } = [];
    /// <summary>
    /// List of users that added a heart as reaction to the message
    /// </summary>
    public List<int> Reactions { set; get; } = [];
}
