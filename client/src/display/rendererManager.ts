import Renderer from "../instance/renderer";
import Message from "../models/message";
import MessageInstance from "./messageInstance";

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

    new MessageInstance(container, msg.date, msg.authors.map(currentChannel.renderer.getInfoFromId), msg.content);
    scrollToBottom();
}

let currentChannel: TargettedChannel | null = null;

export function renderer_initDisplay(r: Renderer, servId: number, chanId: number): boolean {
    if (currentChannel !== null &&
        (currentChannel.serverId !== servId || currentChannel.channelId !== chanId || currentChannel.renderer.network.website !== r.network.website)
    ) {
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