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

public class ChannelInfo : BaseMessage
{
    public int Id { set; get; }
    public string Name { set; get; }
    public Message[] Messages { set; get; }
}

public class UserInfo : BaseMessage
{
    public string Id { set; get; }
    public bool IsMe { set; get; }
    public string Username { set; get; }
}

/// <summary>
/// Represent a message sent
/// </summary>
public class Message : BaseMessage
{
    public string Author { set; get; }
    public string Content { set; get; }
    public Timestamp SentAt { set; get; }
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