// Manage user attaching things to a message
// TODO: Don't make global

interface MessageAttachment
{
    serverId: number;
    channelId: number;
    files: any[];
}

export default class Attachment {

    // Attachments that are being sent
    attachments: { [id: number] : MessageAttachment; };
    currAttachments: any[];

    constructor() {
        this.attachments = {};
        this.currAttachments = [];
    }

    refreshDisplay() {
        if (this.currAttachments.length > 0) {
            document.getElementById("attach-file-container").classList.add("is-primary");
        } else {
            document.getElementById("attach-file-container").classList.remove("is-primary");
        }
    }

    setAttachment(files: any[]) {
        this.currAttachments = [...files];

        this.refreshDisplay();
    }

    hasAttachment() {
        return this.currAttachments.length > 0;
    }

    addAttachmentToMessage(tempId: number, servId: number, chanId: number) {
        this.attachments[tempId] = {
            serverId: servId,
            channelId: chanId,
            files: this.currAttachments
        };
    }

    getAttachment(tempId: number): any[] | null {
        if (tempId in this.attachments) {
            return this.attachments[tempId].files;
        } else {
            return [];
        }
    }

    discardAttachment(tempId: number) {
        if (tempId in this.attachments) delete this.attachments[tempId];
    }
}