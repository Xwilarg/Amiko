import Renderer from "../instance/renderer";
import UserInfo from "../models/userInfo";
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
        let date;
        if (msg.sentAt) {
            date = new Date((msg.sentAt - (new Date().getTimezoneOffset() * 60)) * 1000);
        } else {
            date = msg.date;
        }
        sendMessageInternal(date, msg.authors.map(getInfoFromId), msg.content, msg.attachments, [], `msg-${msg.id}`, msg.id);
    }
}

export function renderer_sendMessageInternal(date: Date, infos: UserInfo[], text: string) {
    const container = document.getElementById("messages");

    new MessageInstance(container, date, infos, text);
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