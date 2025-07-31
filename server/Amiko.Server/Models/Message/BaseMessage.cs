namespace Amiko.Server.Models.Message;

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
