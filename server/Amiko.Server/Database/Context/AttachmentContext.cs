using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Amiko.Server.Database.Context;

/// <summary>
/// Represents an attachment
/// Attachments are files that are sent along a message
/// </summary>
public class AttachmentContext
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int Id { set; get; }
    /// <summary>
    /// Raw data contains in the attachment
    /// </summary>
    public byte[] Data { set; get; }
    /// <summary>
    /// Name of the file of the attachment
    /// </summary>
    public string Filename { set; get; }
    /// <summary>
    /// <see href="https://developer.mozilla.org/fr/docs/Web/HTTP/Guides/MIME_types"></see>
    /// Used to determine the type of the attachment
    /// </summary>
    public string Mimetype { set; get; }
}

