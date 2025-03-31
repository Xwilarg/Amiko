// Manage user attaching things to a message

import { sendAttachmentOverNetwork } from "./network";

let attachments = {};

export function addAttachment(tempId, files) {
    attachments[tempId] = [...files];
}

export function sendAttachment(finalId, tempId) {
    if (tempId in attachments) {
        sendAttachmentOverNetwork(finalId, attachments[tempId]);
        delete attachments[tempId];
    }
}

export function discardAttachment(tempId) {
    if (tempId in attachments) delete attachments[tempId];
}