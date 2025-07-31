using Amiko.Database.Context;

namespace Amiko.Database.Queries
{
    public class AttachmentQuery
    {
        /// <returns>null mean the message was not found, else return a potentially empty array</returns>
        public static IEnumerable<AttachmentContext>? GetAttachment(
            SqliteContext ctx,
            int servId,
            int chanId,
            int msgId,
            int? claimId)
        {
            var m = MessageQuery.GetMessage(ctx, servId, chanId, msgId, claimId, null, ServerIncludes.IncludesAttachments);
            return m?.Attachments;
        }

        public static int? AddAttachment(
            SqliteContext ctx,
            int servId,
            int chanId,
            int msgId,
            int claimId,
            string filename,
            string contentType,
            byte[] data)
        {
            var msg = MessageQuery.GetMessage(ctx, servId, chanId, msgId, claimId, null, ServerIncludes.IncludesAttachments);
            if (msg == null) return null;
            if (!msg.Authors.Any(x => UserQuery.DoesUserFillClaim(ctx, claimId, x))) return null;

            msg.Attachments.Add(new AttachmentContext()
            {
                Filename = filename,
                Mimetype = contentType,
                Data = data
            });

            ctx.SaveChanges();
            return msg.Id;
        }
    }
}
