using ProtoBuf;

namespace Amiko.Common;

[ProtoContract]
public class Message
{
    [ProtoMember(1)]
    public string Name { get; set; }
    [ProtoMember(2)]
    public string Content { get; set; }
}
