using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Server.Database.Context;

/// <summary>
/// Represent a server
/// </summary>
public class ServerContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }

    /// <summary>
    /// Display name of the server
    /// </summary>
    public string Name { set; get; }
    /// <summary>
    /// Color of the server icon
    /// </summary>
    public int Color { set; get; }
    /// <summary>
    /// Character inside the server icon
    /// </summary>
    public string Character { set; get; }
    /// <summary>
    /// List of channels available on this server
    /// </summary>
    public List<ChannelContext> Channels { set; get; } = [];
    /// <summary>
    /// Can any user access this channel or is there an allow list
    /// </summary>
    public bool IsPublic { set; get; } = true;

    /// <summary>
    /// Ephemerals servers only keep X messages in their channels
    /// When a channel get more than the allowed amount of messages, the old ones are deleted
    /// </summary>
    public bool IsEphemeral { set; get; } = false;
    /// <summary>
    /// Guests are users that don't need to login
    /// It is a system so people can use Amiko without the need to creating an account
    /// When true, the current server allow guests account to read/send messages there
    /// </summary>
    public bool AllowsGuest { set; get; } = false;
}