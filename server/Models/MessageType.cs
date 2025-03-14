namespace Amiko.Models;

public enum MessageType
{
    Message,
    Acknowledge,
    ServerInfo,
    /// <summary>
    /// The message is an array of other message, user need to look at the type of the first message to know what is received
    /// </summary>
    Array
}
