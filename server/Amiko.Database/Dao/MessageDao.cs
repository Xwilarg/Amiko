using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record MessageDao(
    int Id,
    DateTime CreationTime,
    string Message,
    int[] Authors,
    IEnumerable<AttachmentDao> Attachments,
    List<int> Reactions
)
{
    internal static MessageDao From(MessageContext ctx)
    {
        return new(
            ctx.Id,
            ctx.CreationTime,
            ctx.Message,
            ctx.Authors,
            ctx.Attachments.Select(AttachmentDao.From),
            ctx.Reactions
        );
    }
}
