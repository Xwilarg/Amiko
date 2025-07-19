using Amiko.Server.Database.Context;
using Amiko.Server.Database.Dao;

namespace Amiko.Server.Services;

/// <summary>
/// Manage message parsing
/// </summary>
public class MessageManager
{
    private SqliteContext _dbContext;

    public MessageManager(SqliteContext dbContext)
    {
        _dbContext = dbContext;
    }

    public UpdatedContent? ParseMessage(string content, int[]? authors, int claimId)
    {
        UpdatedContent retData = new()
        {
            Content = content
        };

        var prefix = content.Split(' ')[0].ToLowerInvariant();
        UserContext? targetUser = UserQuery.GetUserFromPrefix(_dbContext, prefix, claimId, UserIncludes.None);
        if (targetUser != null) // We found a valid matching user with the prefix
        {
            retData.Content = content[prefix.Length..].TrimStart(); // We remove the prefix from the message
            retData.Authors = [targetUser];
        }
        else if (authors == null || authors.Length == 0) // Author not specified, it means the author is the claimId
        {
            retData.Authors = [UserQuery.GetUser(_dbContext, claimId, UserIncludes.None)];
        }
        else
        {
            foreach (var author in authors) // In case of co-fronting, a message can have multiple authors, we need to validate each of them
            {
                // Check for perm issues, we also throw an error is a user is there twice
                if (!UserQuery.DoesUserFillClaim(_dbContext, claimId, author) || retData.Authors.Any(x => x.Id == author))
                {
                    return null;
                }
                targetUser = UserQuery.GetUser(_dbContext, author, UserIncludes.None);
                retData.Authors.Add(targetUser);
            }
        }

        return retData;
    }

    public class UpdatedContent
    {
        public List<UserContext>? Authors = [];
        public string Content;
    }
}
