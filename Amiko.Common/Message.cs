namespace Amiko.Common;

public class BaseMessage
{
    public MessageType Type { set; get; }
}

public class Timestamp
{
    public long Seconds { set; get; }
    public int Nanos { set; get; }
}

public class Message : BaseMessage
{
    public string Name { set; get; }
    public string Content { set; get; }
    public Timestamp SentAt { set; get; }
    public int Id { set; get; }
}

public class MessageGroup : BaseMessage
{
    public Message[] Messages { set; get; }
}

public class Acknowledge : BaseMessage
{
    public int Id { set; get; }
    public bool IsError { set; get; }
}