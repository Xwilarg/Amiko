// Manage user attaching things to a message

import { sendAttachmentOverNetwork } from "./network";

let attachments = {};

let currAttachments;

export function setAttachment(files) {
    currAttachments = files;

    if (files.length > 0) {
        document.getElementById("attach-file-container").classList.add("is-primary");
    } else {
        document.getElementById("attach-file-container").classList.remove("is-primary");
    }
}

export function addAttachment(tempId, servId, chanId, files) {
    console.log(servId);
    attachments[tempId] = {
        servId: servId,
        chanId: chanId,
        files: [...files]
    };
}

export function sendAttachment(finalId, tempId) {
    if (tempId in attachments) {
        const elem = attachments[tempId];
        sendAttachmentOverNetwork(elem.servId, elem.chanId, finalId, elem.files);
        delete attachments[tempId];
    }
}

export function discardAttachment(tempId) {
    if (tempId in attachments) delete attachments[tempId];
}