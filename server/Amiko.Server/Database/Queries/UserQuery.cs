using Amiko.Server.Database.Context;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Amiko.Server.Database.Dao;

public enum UserIncludes
{
    None,
    IncludesLastSeen
}

public static class UserQuery
{
    public static IQueryable<UserContext> GetUsersAsQueryable(SqliteContext ctx, UserIncludes includes)
    {
        if (includes == UserIncludes.IncludesLastSeen)
        {
            return ctx.Users.Include(x => x.LastSeens);
        }
        return ctx.Users;
    }

    public static IEnumerable<UserContext> GetUsers(SqliteContext ctx, UserIncludes includes)
    {
        return GetUsersAsQueryable(ctx, includes);
    }

    public static IEnumerable<UserContext> GetServerWebhooks(SqliteContext ctx, int servId, UserIncludes includes)
    {
        return GetUsersAsQueryable(ctx, includes).Where(x => x.Webhook != null && ServerQuery.CanAccessServer(ctx, servId, x.Id));
    }

    /// <summary>
    /// See if prefix given in parameter match a user
    /// </summary>
    public static UserContext? GetUserFromPrefix(SqliteContext ctx, string prefix, int claimId, UserIncludes includes)
    {
        return GetUsersAsQueryable(ctx, includes).FirstOrDefault(x => x.Prefix == prefix &&  DoesUserFillClaim(ctx, x.Id, claimId));
    }

    public static UserContext? GetUser(SqliteContext ctx, int id, UserIncludes includes)
    {
        return GetUsersAsQueryable(ctx, includes).FirstOrDefault(x => x.Id == id);
    }

    public static UserContext? GetUserFromPassword(SqliteContext ctx, string password, string salt)
    {
        foreach (var u in ctx.Users)
        {
            var saltBytes = Encoding.ASCII.GetBytes(u.Salt);
            var hash = KeyDerivation.Pbkdf2(password, saltBytes, KeyDerivationPrf.HMACSHA512, 210000, 256 / 8);

            var computed = Convert.ToHexString(hash).ToLower();
            if (u.Password == computed) return u;
        }

        return null;
    }

    public static bool UpdateLastSeen(SqliteContext ctx, int servId, int chanId, int claimId, long now)
    {
        var s = ServerQuery.GetServer(ctx, servId, claimId, null, ServerIncludes.None);
        if (s == null) return false; // We can't access this server!

        var u = GetUser(ctx, claimId, UserIncludes.IncludesLastSeen);
        var seen = u.LastSeens.FirstOrDefault(x => x.ServId == servId && x.ChanId == chanId);
        if (seen == null)
        {
            u.LastSeens.Add(new() { ServId = servId, ChanId = chanId, LastSeen = now });
        }
        else
        {
            seen.LastSeen = now;
        }
        ctx.SaveChanges();
        return true;
    }

    /// <summary>
    /// Does the identity given (who the user pretend to be) allowed by current claim
    /// This mean targetted account is either us or an account that depends on us
    /// </summary>
    public static bool DoesUserFillClaim(SqliteContext ctx, int claimId, int identity)
    {
        if (claimId == identity) // User is claim
            return true;

        var rawTarget = GetUser(ctx, claimId, UserIncludes.None);
        var identityTarget = GetUser(ctx, identity, UserIncludes.None);
        if (rawTarget == null || identityTarget == null)
            return false; // User doesn't exists

        // Check dependencies
        return identityTarget.DependsOf == claimId || rawTarget.DependsOf == identity;
    }
}
