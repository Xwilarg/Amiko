namespace Amiko.Server.Models.Message;

public class AttachmentMessage
{
    /// <summary>
    /// Filename of the attachment
    /// </summary>
    public required string Name { set; get; }

    /// <summary>
    /// ID to find back the attachment in DB
    /// </summary>
    public required int Id { set; get; }
}
