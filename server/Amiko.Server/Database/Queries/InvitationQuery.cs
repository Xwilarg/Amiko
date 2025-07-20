using Amiko.Server.Database.Context;
using Amiko.Server.Database.Dao;

namespace Amiko.Server.Database.Queries
{
    public class InvitationQuery
    {
        /// <returns>null mean the message was not found, else return a potentially empty array</returns>
        public static IEnumerable<AttachmentContext>? GetAttachment(
            SqliteContext ctx,
            int servId,
            int chanId,
            int msgId,
            int? claimId)
        {
            var m = MessageQuery.GetMessage(ctx, servId, chanId, msgId, claimId, null, ServerIncludes.IncludesAttachments);
            return m?.Attachments;
        }

        public static bool CreateUserFromInvitation(SqliteContext ctx, string invitation, string name, string password)
        {
            if (UserQuery.GetUser(ctx, name, UserIncludes.None) != null) return false;

            var invite = ctx.Invitations.FirstOrDefault(x => x.Id == invitation);
            if (invite == null) return false;

            if (DateTime.UtcNow > invite.ExpirationDate)
            {
                ctx.Invitations.Remove(invite);
                ctx.SaveChanges();
                return false; // Invitation exists but already expired!
            }

            ctx.Invitations.Remove(invite);
            UserQuery.CreateUser(ctx, name, invite.IsAdmin, password);

            // CreateUser already call ctx.SaveChanges so we don't do it again

            return true;
        }

        public static string CreateInvitation(
            SqliteContext ctx,
            bool isAdmin)
        {
            var id = Guid.NewGuid().ToString();

            for (int i = ctx.Invitations.Count() - 1; i >=  0; i--) // Remove expired invitations
            {
                if (DateTime.UtcNow > ctx.Invitations.ElementAt(i).ExpirationDate)
                {
                    ctx.Invitations.Remove(ctx.Invitations.ElementAt(i));
                }
            }

            ctx.Invitations.Add(new()
            {
                Id = id,
                IsAdmin = isAdmin,
                ExpirationDate = DateTime.UtcNow.AddDays(14),
            });

            ctx.SaveChanges();

            return id;
        }

        public static bool IsInvitationValid(SqliteContext ctx, string code)
        {
            var invitation = ctx.Invitations.FirstOrDefault(x => x.Id == code);
            if (invitation == null) return false;

            return invitation.ExpirationDate <= DateTime.UtcNow;
        }
    }
}
