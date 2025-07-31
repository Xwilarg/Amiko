namespace Amiko.Server.Models.Message;

public class AttachmentMessage
{
    /// <summary>
    /// Filename of the attachment
    /// </summary>
    public string Name { set; get; }

    /// <summary>
    /// ID to find back the attachment in DB
    /// </summary>
    public int Id { set; get; }
}
