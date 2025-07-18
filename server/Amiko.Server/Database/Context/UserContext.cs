using System.ComponentModel.DataAnnotations;

namespace Amiko.Server.Database.Context;

/// <summary>
/// Represent a user account
/// A user can be one of the following:
/// - User: Login with a password
/// - AltUser: Attached to an user, need to login with the main user
/// - Webhook: Listen to a server, use a webhook URL
/// </summary>
public class UserContext
{
    [Key] public int Id { set; get; }
    /// <summary>
    /// Display name of the user
    /// </summary>
    public string Username { set; get; }
    /// <summary>
    /// User only
    /// Hashed password of the user
    /// </summary>
    public string? Password { set; get; }

    /// <summary>
    /// Salt of the stored password
    /// </summary>
    public string? Salt { set; get; }

    /// <summary>
    /// AltUser only
    /// Which user is the current account dependent of
    /// </summary>
    public int? DependsOf { set; get; }
    /// <summary>
    /// AltUser only
    /// Prefix that can be used to identify a message as the current altuser
    /// </summary>
    public string? Prefix { set; get; }
    /// <summary>
    /// Webhook only
    /// Target webhook to which a message need to be dispatched to
    /// </summary>
    public string? Webhook { set; get; }

    /// <summary>
    /// Color of the account pfp
    /// </summary>
    public int Color { set; get; }
    /// <summary>
    /// Character in the account pfp
    /// </summary>
    public string Character { set; get; }

    /// <summary>
    /// For each channel, when were messages last seen
    /// If a channel isn't in the list, it mean the user never saw it
    /// </summary>
    public List<ChannelSeen> LastSeens { set; get; } = [];
}