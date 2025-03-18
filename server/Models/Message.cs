using Amiko.Server.Models;

namespace Amiko.Models;

/// <summary>
/// Base class for a network message
/// </summary>
public class BaseMessage
{
    public MessageType Type { set; get; }
}

public class ArrayMessage<T> : BaseMessage
    where T : BaseMessage
{
    public T[] Data { set; get; }
}

/// <summary>
/// Simplified represetation of a timestamp
/// <see href="https://github.com/protocolbuffers/protobuf/blob/main/src/google/protobuf/timestamp.proto#L133"/>
/// </summary>
public class Timestamp
{
    public long Seconds { set; get; }
    public int Nanos { set; get; }
}

public class ServerInfo : BaseMessage
{
    public int Id { set; get; }
    public string Name { set; get; }
    public ChannelInfo[] Channels { set; get; }
}
public class ChannelInfo
{
    public int Id { set; get; }
    public string Name { set; get; }
    public Message[] Messages { set; get; }
}

public class UserInfo : BaseMessage
{
    public string Id { set; get; }
    public bool IsMe { set; get; }
    public bool IsMyGroup { set; get; }
    public string Username { set; get; }
    public Color Color { set; get; }
    public char Character { set; get; }
}

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
    public string Author { set; get; }
    /// <summary>
    /// Content of the message
    /// </summary>
    public string Content { set; get; }
    /// <summary>
    /// When the message was sent
    /// </summary>
    public Timestamp SentAt { set; get; }
    /// <summary>
    /// ID of the message, used for acknowledgement
    /// </summary>
    public int Id { set; get; }
}

/// <summary>
/// Acknowledgement of message received
/// </summary>
public class Acknowledge : BaseMessage
{
    public int Id { set; get; }
    public bool IsError { set; get; }
}