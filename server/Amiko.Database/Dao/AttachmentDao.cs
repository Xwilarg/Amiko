using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record AttachmentDao(
    int Id,
    byte[] Data,
    string Filename,
    string Mimetype
)
{
    internal static AttachmentDao From(AttachmentContext ctx)
    {
        return new(ctx.Id, ctx.Data, ctx.Filename, ctx.Mimetype);
    }
}
