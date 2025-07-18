using Amiko.Server.Database.Context;
using Amiko.Server.Models.Response;

namespace Amiko.Server.Database.Dao;

public static class ChannelQuery
{
    public static ChannelContext? GetChannel(
        SqliteContext ctx,
        int servId,
        int chanId,
        int? claimId,
        int? msgCount,
        ServerIncludes includes)
    {
        var s = ServerQuery.GetServer(ctx, servId, claimId, msgCount, includes);
        return s?.Channels?.FirstOrDefault(x => x.Id == chanId);
    }

    public static void AddChannel(SqliteContext ctx, ChannelInfo info)
    {
        /*
        var color = info.Color ?? new Color() { R = 54, G = 54, B = 54 };
        var serv = new ServerContext()
        {
            Name = info.Name,
            AllowedUsers = info.AllowedUsers?.ToList(),
            Color = color.R << 16 | color.G << 8 | color.B,
            Character = character ?? name[0].ToString(),
            IsEphemeral = isEphemeral,
            AllowsGuest = allowsGuest
        };
        _ctx.Servers.Add(serv);
        _ctx.SaveChanges();

        return serv.Id;
        */
    }
}
