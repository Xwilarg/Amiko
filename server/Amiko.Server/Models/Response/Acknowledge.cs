namespace Amiko.Server.Models.Response;

/// <summary>
/// Acknowledgement of message received
/// </summary>
public class Acknowledge : BaseMessage
{
    /// <summary>
    /// New definitive ID of the message
    /// </summary>
    public int NewId { set; get; }

    /// <summary>
    /// AckId received
    /// </summary>
    public int AckId { set; get; }

    /// <summary>
    /// If we use a prefix to specify a second account, the author returned can be different than the sender
    /// </summary>
    public string? Content { set; get; }
    public int[] Authors { set; get; }
    public bool IsError { set; get; }
}
