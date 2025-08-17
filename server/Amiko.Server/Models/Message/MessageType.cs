namespace Amiko.Server.Models.Message;

public enum MessageType
{
    Heartbeat,
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
    UserInfo,
    /// <summary>
    /// Update the server to tell it a channel was seen recently
    /// </summary>
    SeenUpdate,
    /// <summary>
    /// A message was updated
    /// </summary>
    MessageUpdate,
    /// <summary>
    /// A server was updated
    /// </summary>
    ServerUpdate,
    /// <summary>
    /// A channel was updated
    /// </summary>
    ChannelUpdate,
    /// <summary>
    /// An user was updated
    /// </summary>
    UserUpdate
}
