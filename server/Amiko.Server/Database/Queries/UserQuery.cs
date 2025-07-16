using Amiko.Server.Database.Context;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Amiko.Server.Database.Dao;

public static class UserQuery
{
    public static IEnumerable<UserContext> GetUsers(SqliteContext ctx)
    {
        return ctx.Users;
    }

    /// <summary>
    /// See if prefix given in parameter match a user
    /// </summary>
    public static IEnumerable<UserContext> GetUsersFromPrefix(SqliteContext ctx, string prefix)
    {
        return ctx.Users.Where(x => x.Prefix == prefix);
    }

    public static UserContext? GetUserWithLastSeen(SqliteContext ctx, int claimId)
    {
        return ctx.Users.Include(u => u.LastSeens).FirstOrDefault(x => x.Id == claimId);
    }

    public static UserContext? GetUser(SqliteContext ctx, int claimId)
    {
        return ctx.Users.FirstOrDefault(x => x.Id == claimId);
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
}
