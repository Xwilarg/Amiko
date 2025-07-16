namespace Amiko.Server.Models.Response;

public class AttachmentInfo
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
