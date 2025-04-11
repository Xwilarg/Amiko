import Notification from "../instance/notification";
import Renderer from "../instance/renderer";
import Message from "../models/message";
import { preferences_getCurrentAltUser } from "../persistancy/preferences";
import MessageInstance, { MessageFlag } from "./messageInstance";

// Current message ID
let currId = 1;
let displayedMessages: MessageInstance[] = [];

// Current channel we are writing in
interface TargettedChannel {
    renderer: Renderer;
    serverId: number;
    channelId: number;
}

export function renderer_getMessageByAckId(ackId: number): MessageInstance {
    return displayedMessages.find(x => x.message.ackId === ackId);
}
export function renderer_getMessageById(id: number): MessageInstance {
    return displayedMessages.find(x => x.message.id === id);
}

/// Scroll at the bottom of the current container
function scrollToBottom() {
    const container = document.getElementById("messages");
    container.scrollTo(0, container.scrollHeight);
}

/// Remove and re-render all the messages on screen
export function renderer_refreshMessageDisplay() {
    displayedMessages = [];

    const targetChannel = currentChannel.renderer.servers[currentChannel.serverId].channels[currentChannel.channelId];
    const chanName = targetChannel.name;

    document.getElementById("channel-title").innerHTML = chanName;

    // Update all messages
    const container = document.getElementById("messages");
    container.innerHTML = "";
    for (const msg of targetChannel.messages) {
        renderer_sendMessageInternal(msg, MessageFlag.None);
    }

    // Whole message list are updated when we display a new channel or so
    // Hense we send a "seen" notification
    renderer_seeChannel();
}

/// Add a message on screen
export function renderer_sendMessageInternal(msg: Message, flag: MessageFlag) {
    const container = document.getElementById("messages");

    let msgInst = new MessageInstance(container, msg, currentChannel?.renderer, flag);
    displayedMessages.push(msgInst);
    scrollToBottom();
}

let currentChannel: TargettedChannel | null = null;

/// Initialize display on a specific channel
export function renderer_initDisplay(r: Renderer, servId: number, chanId: number): boolean {
    if (currentChannel !== null && !renderer_isCurrentChannel(r, servId, chanId)) {
        return;
    }

    console.log(`Automatically load channel ${servId} / ${chanId}`);
    currentChannel = {
        renderer: r,
        channelId: chanId,
        serverId: servId
    };
}

export function renderer_switchChannel(r: Renderer, servId: number, chanId: number) {
    currentChannel = {
        renderer: r,
        channelId: chanId,
        serverId: servId
    };

    renderer_refreshMessageDisplay();
    currentChannel.renderer.attachment.refreshDisplay();
}

export function renderer_seeChannel() {
    currentChannel.renderer.servers[currentChannel.serverId].notification.removeNotification(currentChannel.channelId);
    currentChannel.renderer.network.sendMessage({
        type: 6,
        serverId: currentChannel.serverId,
        channelId: currentChannel.channelId
    });
}

export function renderer_showCurrentChannels() {
    const channels = document.getElementById("channels");
    channels.innerHTML = "";
    const currServ = currentChannel.renderer.servers[currentChannel.serverId];
    
    for (const [key, value] of Object.entries(currServ.channels)) {
        const chanBtn = document.createElement("button");
        chanBtn.innerHTML = value.name;
        chanBtn.classList.add("button");
        if (currentChannel.channelId == parseInt(key)) chanBtn.classList.add("is-primary");

        if (currServ.notification.channels.includes(parseInt(key))) {
            new Notification(chanBtn, true);
        }

        chanBtn.addEventListener("click", (e) => {
            currentChannel.channelId = parseInt(key);
            renderer_refreshMessageDisplay();
            document.querySelector("#channels > .is-primary").classList.remove("is-primary");
            (e.target as HTMLElement).classList.add("is-primary");

            document.getElementById("channel-list").classList.add("is-hidden");
        });

        document.getElementById("channels").appendChild(chanBtn);
    }
}

export function renderer_isCurrentServer(r: Renderer, servId: number): boolean {
    if (currentChannel === null) return false;

    return currentChannel.renderer.network.website === r.network.website && currentChannel.serverId === servId;
}

export function renderer_isCurrentChannel(r: Renderer, servId: number, chanId: number): boolean {
    return renderer_isCurrentServer(r, servId) && currentChannel.channelId === chanId;
}

export function renderer_getCurrentRenderer(): Renderer { return currentChannel.renderer; }
export function renderer_getCurrentServer(): number { return currentChannel.serverId; }
export function renderer_getCurrentChannel(): number { return currentChannel.channelId; }

export async function renderer_initAsync() {
    // Sending messages
    document.getElementById("send-message").addEventListener("click", e => {
        e.preventDefault();
        const content = document.getElementById("message-field") as HTMLInputElement;
        const fileInput = document.getElementById("attach-file");
        if (content.value || currentChannel.renderer.attachment.hasAttachment()) {
            var newMsg = {
                type: 2,
                content: content.value,
                ackId: currId,
                serverId: currentChannel.serverId,
                channelId: currentChannel.channelId,
                authors: preferences_getCurrentAltUser(currentChannel.renderer.network.website)
            };
            const msgInst = currentChannel.renderer.addMyMessage(currentChannel.serverId, currentChannel.channelId, newMsg)
            renderer_sendMessageInternal(msgInst, MessageFlag.None);
            currentChannel.renderer.network.sendMessage(newMsg);

            if (currentChannel.renderer.attachment.hasAttachment()) {
                currentChannel.renderer.attachment.addAttachmentToMessage(currId, currentChannel.serverId, currentChannel.channelId);
            }

            // Unset send field
            content.value = "";
            currentChannel.renderer.attachment.setAttachment([]);
            currId++;
        }
    });
    document.getElementById("message-field").addEventListener("keypress", (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            document.getElementById("send-message").click();
            e.preventDefault();
        }
    });
    
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            currentChannel.renderer.attachment.setAttachment([]);
        }
    });
    document.addEventListener("paste", e => {
        for (var item of e.clipboardData.items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file.size > 2000000) {
                    currentChannel.renderer.attachment.setAttachment([]);
                    alert("File must be smaller than 2MB");
                } else {
                    currentChannel.renderer.attachment.setAttachment([ file ]);
                }
                break;
            }
        }
    });
    document.getElementById("attach-file").addEventListener("change", e => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
            if (target.files[0].size > 2000000) {
                currentChannel.renderer.attachment.setAttachment([]);
                alert("File must be smaller than 2MB");
            } else {
                // @ts-ignore
                currentChannel.renderer.attachment.setAttachment(target.files);
            }
        } else {
            currentChannel.renderer.attachment.setAttachment([]);
        }
        target.value = "";
    });

    // Channel settings
    document.getElementById("export-button").onclick = () => {
        if (currentChannel === null) return;

        currentChannel.renderer.network.downloadChanExport(currentChannel.renderer.servers[currentChannel.serverId].channels[currentChannel.channelId].name, currentChannel.serverId, currentChannel.channelId);
    };
}