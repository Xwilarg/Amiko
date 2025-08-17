using Amiko.Database.Context;
using Amiko.Database.Dao;

namespace Amiko.Database.Queries
{
    public class InvitationQuery
    {
        /// <returns>null mean the message was not found, else return a potentially empty array</returns>
        public static InvitationDao? GetInvitation(
            SqliteContext ctx,
            string id)
        {
            var i = ctx.Invitations.FirstOrDefault(x =>  x.Id == id);
            return i == null ? null : InvitationDao.From(i);
        }

        public static int CreateUserFromInvitation(SqliteContext ctx, string invitation, string name, string password)
        {
            if (UserQuery.GetUserInternal(ctx, name, UserIncludes.None) != null) return -1;

            var invite = ctx.Invitations.FirstOrDefault(x => x.Id == invitation);
            if (invite == null) return -1;

            if (DateTime.UtcNow > invite.ExpirationDate)
            {
                ctx.Invitations.Remove(invite);
                ctx.SaveChanges();
                return -1; // Invitation exists but already expired!
            }

            ctx.Invitations.Remove(invite);
            var id = UserQuery.CreateUser(ctx, name, invite.IsAdmin, password);

            // CreateUser already call ctx.SaveChanges so we don't do it again

            return id;
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
