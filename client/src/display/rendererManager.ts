import Renderer from "../instance/renderer";
import Message from "../models/message";
import { getCurrentAltUser } from "../persistancy/preferences";
import MessageInstance from "./messageInstance";

// Current message ID
let currId = 1;

// Current channel we are writing in
interface TargettedChannel {
    renderer: Renderer;
    serverId: number;
    channelId: number;
}

function scrollToBottom() {
    const container = document.getElementById("messages");
    container.scrollTo(0, container.scrollHeight);
}

function refreshMessageDisplay() {
    const targetChannel = currentChannel.renderer.servers[currentChannel.serverId].channels[currentChannel.channelId];
    const chanName = targetChannel.name;

    document.getElementById("channel-title").innerHTML = chanName;

    // Update all messages
    const container = document.getElementById("messages");
    container.innerHTML = "";
    for (const msg of targetChannel.messages) {
        renderer_sendMessageInternal(msg);
    }
}

export function renderer_sendMessageInternal(msg: Message) {
    const container = document.getElementById("messages");

    new MessageInstance(container, msg, currentChannel.renderer);
    scrollToBottom();
}

let currentChannel: TargettedChannel | null = null;

export function renderer_initDisplay(r: Renderer, servId: number, chanId: number): boolean {
    if (currentChannel !== null && !renderer_isCurrentChannel(r, servId, chanId)) {
        return;
    }

    console.log(`Automatically load channel ${servId} / ${chanId}`);
    (document.getElementById("message-form") as HTMLButtonElement).disabled = false;
    currentChannel = {
        renderer: r,
        channelId: chanId,
        serverId: servId
    };

    refreshMessageDisplay();
}

export function renderer_isCurrentServer(r: Renderer, servId: number): boolean {
    if (currentChannel === null) return false;

    return currentChannel.renderer.network.website === r.network.website && currentChannel.serverId === servId;
}

export function renderer_isCurrentChannel(r: Renderer, servId: number, chanId: number): boolean {
    return renderer_isCurrentServer(r, servId) && currentChannel.channelId === chanId;
}

export async function renderer_initAsync() {
    // Sending messages
    document.getElementById("send-message").addEventListener("click", e => {
        e.preventDefault();
        const content = document.getElementById("message-field") as HTMLInputElement;
        const fileInput = document.getElementById("attach-file");
        if (content.value) {
            var newMsg = {
                type: 2,
                content: content.value,
                ackId: currId,
                serverId: currentChannel.serverId,
                channelId: currentChannel.channelId,
                authors: getCurrentAltUser()
            };
            currentChannel.renderer.network.sendMessage(newMsg);
            const msgInst = currentChannel.renderer.addMyMessage(currentChannel.serverId, currentChannel.channelId, newMsg)
            renderer_sendMessageInternal(msgInst);

            // Unset send field
            content.value = "";
            currId++;
        }
    });
    document.getElementById("message-field").addEventListener("keypress", (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            document.getElementById("send-message").click();
            e.preventDefault();
        }
    });
}