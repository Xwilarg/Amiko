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
    public long LastSeen { set; get; }
}

public class UserInfo : BaseMessage
{
    public int Id { set; get; }
    public bool IsMe { set; get; }
    public bool IsMyGroup { set; get; }
    public string Username { set; get; }
    public Color Color { set; get; }
    public string Character { set; get; }
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
    public int? Author { set; get; }
    /// <summary>
    /// Content of the message
    /// </summary>
    public string Content { set; get; }
    /// <summary>
    /// When the message was sent
    /// </summary>
    public long SentAt { set; get; }
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
    /// <summary>
    /// If we use a prefix to specify a second account, the author returned can be different than the sender
    /// </summary>
    public string? Content { set; get; }
    public int? Author { set; get; }
    public bool IsError { set; get; }
}

public class SeenUpdate : BaseMessage
{
    public int ServerId { set; get; }
    public int ChannelId { set; get; }
}