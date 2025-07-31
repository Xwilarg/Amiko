using Amiko.Database.Context;

namespace Amiko.Database.Dao;

public record InvitationDao(
    string Id,
    DateTime ExpirationDate,
    bool IsAdmin
)
{
    internal static InvitationDao From(InvitationContext ctx)
    {
        return new(
            ctx.Id,
            ctx.ExpirationDate,
            ctx.IsAdmin
        );
    }
}
