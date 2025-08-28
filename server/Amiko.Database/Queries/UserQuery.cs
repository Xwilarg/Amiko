using Amiko.Database.Context;
using Amiko.Database.Dao;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Amiko.Database.Queries;

public enum UserIncludes
{
    None,
    IncludesLastSeen
}

public static class UserQuery
{
    internal static IQueryable<UserContext> GetUsersAsQueryable(SqliteContext ctx, UserIncludes includes)
    {
        if (includes == UserIncludes.IncludesLastSeen)
        {
            return ctx.Users.Include(x => x.LastSeens);
        }
        return ctx.Users;
    }

    public static IEnumerable<UserDao> GetUsers(SqliteContext ctx, UserIncludes includes)
    {
        return GetUsersAsQueryable(ctx, includes).Select(UserDao.From);
    }

    public static IEnumerable<UserDao> GetServerWebhooks(SqliteContext ctx, int servId, UserIncludes includes)
    {
        return GetUsersAsQueryable(ctx, includes).Where(x => x.Webhook != null).AsEnumerable().Where(x => ServerQuery.CanAccessServer(ctx, servId, x.Id)).Select(UserDao.From);
    }

    /// <summary>
    /// See if prefix given in parameter match a user
    /// </summary>
    public static UserDao? GetUserFromPrefix(SqliteContext ctx, string prefix, int claimId, UserIncludes includes)
    {
        var u = GetUsersAsQueryable(ctx, includes).AsEnumerable().FirstOrDefault(x => x.Prefix == prefix && DoesUserFillClaim(ctx, x.Id, claimId));
        return u == null ? null : UserDao.From(u);
    }

    internal static UserContext? GetUserInternal(SqliteContext ctx, int id, UserIncludes includes)
    {
        return GetUsersAsQueryable(ctx, includes).FirstOrDefault(x => x.Id == id);
    }

    internal static UserContext? GetUserInternal(SqliteContext ctx, string username, UserIncludes includes)
    {
        return GetUsersAsQueryable(ctx, includes).FirstOrDefault(x => x.Username == username);
    }

    public static UserDao? GetUser(SqliteContext ctx, int id, UserIncludes includes)
    {
        var u = GetUserInternal(ctx, id, includes);
        return u == null ? null : UserDao.From(u);
    }

    public static UserDao? GetUserFromPassword(SqliteContext ctx, string username, string password)
    {
        var u = GetUserInternal(ctx, username, UserIncludes.None);
        if (u == null) return null;

        var saltBytes = Encoding.ASCII.GetBytes(u.Salt);
        var hash = KeyDerivation.Pbkdf2(password, saltBytes, KeyDerivationPrf.HMACSHA512, 210000, 256 / 8);

        var computed = Convert.ToHexString(hash).ToLower();
        if (u.Password == computed) return UserDao.From(u);

        return null;
    }

    public static bool UpdateLastSeen(SqliteContext ctx, int servId, int chanId, int claimId, long now)
    {
        var s = ServerQuery.GetServerInternal(ctx, servId, claimId, null, ServerIncludes.None);
        if (s == null) return false; // We can't access this server!

        var u = GetUserInternal(ctx, claimId, UserIncludes.IncludesLastSeen);
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

    internal static int CreateUser(SqliteContext ctx, string name, bool isAdmin, string password)
    {
        var salt = Guid.NewGuid().ToString();
        var saltBytes = Encoding.ASCII.GetBytes(salt);
        var hash = KeyDerivation.Pbkdf2(password, saltBytes, KeyDerivationPrf.HMACSHA512, 210000, 256 / 8);
        var computed = Convert.ToHexString(hash).ToLower();

        var user = new UserContext()
        {
            Username = name,
            IsAdmin = isAdmin,
            Password = computed,
            Salt = salt,

            Character = name[0].ToString(),
            Color = 54 << 16 | 54 << 8 | 54,

            DependsOf = null,
            LastSeens = [],
            Prefix = null,
            Webhook = null,
        };
        ctx.Users.Add(user);

        ctx.SaveChanges();

        return user.Id;
    }

    public static bool DeleteUser(SqliteContext ctx, int userId, int claimId)
    {
        if (!DoesUserFillClaim(ctx, claimId, userId))
            return false;

        var user = ctx.Users.FirstOrDefault(x => x.Id == userId);
        if (user == null) return false;

        var matchingIds = ctx.AllowUsers.Where(x => x.UserId == userId);
        ctx.AllowUsers.RemoveRange(matchingIds);

        var parent = ctx.Users.FirstOrDefault(x => x.DependsOf == userId);
        if (parent != null)
        {
            ctx.Users.Remove(parent);
        }
        ctx.Users.Remove(user);
        ctx.SaveChanges();

        return true;
    }

    public static int CreateAltUser(SqliteContext ctx, string name, int claimId)
    {
        var user = new UserContext()
        {
            Username = name,
            IsAdmin = false,
            Password = null,
            Salt = null,

            Character = name[0].ToString(),
            Color = 54 << 16 | 54 << 8 | 54,

            DependsOf = claimId,
            LastSeens = [],
            Prefix = null,
            Webhook = null,
        };
        ctx.Users.Add(user);

        ctx.SaveChanges();

        return user.Id;
    }

    public static bool UpdateUser(SqliteContext ctx, int userId,
        Color? color, string? character, string? username, string? prefix)
    {
        var u = GetUserInternal(ctx, userId, UserIncludes.None);

        if (u == null) return false;

        if (color != null) u.Color = color.R << 16 | color.G << 8 | color.B;
        if (character != null) u.Character = character;
        if (username != null) u.Username = username;
        if (prefix != null) u.Prefix = prefix;

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

        var rawTarget = GetUserInternal(ctx, claimId, UserIncludes.None);
        var identityTarget = GetUserInternal(ctx, identity, UserIncludes.None);
        if (rawTarget == null || identityTarget == null)
            return false; // User doesn't exists

        // Check dependencies
        return identityTarget.DependsOf == claimId || rawTarget.DependsOf == identity;
    }
}
