namespace Amiko.Server.Models.Message;

/// <summary>
/// Base class for a network message
/// </summary>
public interface IBaseMessage
{
    public MessageType Type { get; }
}

public class ArrayMessage<T> : IBaseMessage
    where T : IBaseMessage
{
    public T[] Data { set; get; }

    public MessageType Type => MessageType.Array;
}

public enum UpdateType
{
    Creation,
    Edition,
    Deletion
}