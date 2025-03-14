namespace Amiko.Models;

public enum MessageType
{
    /// <summary>
    /// The message is an array of other message, user need to look at the type of the first message to know what is received
    /// </summary>
    Array,
    /// <summary>
    /// User message
    /// </summary>
    Message,
    /// <summary>
    /// Confirmation of action
    /// </summary>
    Acknowledge,
    ServerInfo,
    UserInfo
}
