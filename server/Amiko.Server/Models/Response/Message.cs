using Amiko.Models;
using Amiko.Server.Database.Context;

namespace Amiko.Server.Models.Response;

/// <summary>
/// Represent a message sent
/// </summary>
public class Message : BaseMessage
{
    /// <summary>
    /// Server in which the message was sent
    /// </summary>
    public int ServerId { set; get; }
    /// <summary>
    /// Channel in which the message was sent
    /// </summary>
    public int ChannelId { set; get; }

    /// <summary>
    /// ID of the author of the message
    /// </summary>
    public int[]? Authors { set; get; }
    /// <summary>
    /// Content of the message
    /// </summary>
    public string Content { set; get; }
    /// <summary>
    /// When the message was sent
    /// </summary>
    public long SentAt { set; get; }
    /// <summary>
    /// ID of the message, used for future actions (attachment upload, deletion, etc...)
    /// </summary>
    public int Id { set; get; }

    /// <summary>
    /// Temporary ID sent by the client, sent back in <seealso cref="Acknowledge"/> message to confirm things were well sent
    /// </summary>
    public int AckId { set; get; }

    public AttachmentInfo[] Attachments { set; get; }

    public static Message From(MessageContext m)
    {
        return new Message()
        {
            Authors = m.Authors,
            Content = m.Message,
            SentAt = (long)(m.CreationTime.ToUniversalTime() - DateTime.UnixEpoch).TotalSeconds,
            Id = m.Id,
            Attachments = m.Attachments.Select(a => new AttachmentInfo()
            {
                Name = a.Filename,
                Id = a.Id
            }).ToArray()
        };
    }

    public static IEnumerable<Message> GetOrderedMessages(IEnumerable<MessageContext> m)
    {
        var msgs = m.Select(From);
        return msgs.OrderBy(x => x.Id);
    }
}
