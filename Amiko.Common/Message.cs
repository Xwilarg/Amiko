using ProtoBuf;

namespace Amiko.Common;

public class BaseMessage
{
    [ProtoMember(1)]
    public MessageType Type { get; set; }
}

[ProtoContract]
public class Message : BaseMessage
{
    [ProtoMember(2)]
    public string Name { get; set; }
    [ProtoMember(3)]
    public string Content { get; set; }
}
