import Network from "./network";
import Server from "../models/server";
import { renderer_getCurrentChannel, renderer_getCurrentServer, renderer_initDisplay, renderer_isCurrentChannel, renderer_isCurrentRenderer, renderer_isCurrentServer, renderer_refreshMessageDisplay, renderer_sendMessageInternal, renderer_showCurrentChannels, renderer_switchChannel } from "../display/rendererManager";
import Channel from "../models/channel";
import User from "../models/user";
import Message from "../models/message";
import MessageInstance, { MessageFlag } from "../display/messageInstance";
import Notification from "./notification";
import { NotificationDisplayMode, NotificationPingMode, preferences_getNotificationDisplayMode, preferences_getNotificationPingMode } from "../persistancy/preferences";
import { session_getLastNotificationReceived, session_setLastNotificationReceived } from "../network/sessionManager";
import Attachment from "./attachment";

export default class Renderer {
    network: Network;

    messages: Message[]; // Faster way to iterate on all messages sent
    servers: { [id: number] : Server; };
    pendingAcknowledgement: { [id: number] : Message; };

    users: { [id: number]: User; };
    mainUser: number;
    possibleUsers: number[];

    attachment: Attachment

    constructor(network: Network) {
        this.network = network;
        this.messages = [];
        this.servers = {};
        this.pendingAcknowledgement = {};
        this.users = {};

        this.mainUser = -1;
        this.possibleUsers = [];

        this.attachment = new Attachment();
    }

    sendSystemMessage(text: string) {
        if (renderer_isCurrentRenderer(this)) {
            renderer_sendMessageInternal({
                id: -1,
                date: new Date(),
                authors: [],
                content: text,
                attachments: [],
    
                ackId: null
            }, MessageFlag.IsSystem);
        }
    }

    sendErrorMessage(text: string) {
        if (renderer_isCurrentRenderer(this)) {
            renderer_sendMessageInternal({
                id: -1,
                date: new Date(),
                authors: [],
                content: text,
                attachments: [],
    
                ackId: null
            }, MessageFlag.IsError);
        }
    }

    // Connection to the current server was closed
    clearAll() {

    }

    // Get a userinfo from an ID
    // If the ID doesn't exist, return a default user
    getInfoFromId(id: number): User {
        if (id in this.users) {
            return this.users[id];
        }
        return {
            id: -1,
            username: id.toString(),
            color: { r: 54, g: 54, b: 54 },
            character: '?'
        };
    }

    getInfoFromIdList(ids: number[]): User[] {
        let users = [];
        for (let id of ids) {
            users.push(this.getInfoFromId(id));
        }
        return users;
    }

    // Does the content checked have @XXXX
    // Where XXXX is one of our possible user
    wasIMentionned(text: string): boolean {
        const infos = this.getInfoFromIdList(this.possibleUsers);
        return infos.some(x => text.toLowerCase().includes(`@${x.username.toLowerCase()}`));
    }

    editMessage(msg, msgInst: MessageInstance) {
        let message = this.messages.find(x => x.id === msg.id);
        if (message === null) {
            console.error("Impossible to find message that was edited");
            return;
        }
        if (msg.attachments.length > 0) {
            message.attachments = msg.attachments;
            msgInst?.parseAttachments(msgInst.element, msg.id);
        }
    }

    acknowledgeMessage(msg, msgInst: MessageInstance | null) {
        if (!(msg.ackId in this.pendingAcknowledgement))
        {
            console.warn(`Couldn't acknowledge message with ack ID ${msg.ackId}`);
            return;
        }

        let message = this.pendingAcknowledgement[msg.ackId];
        msgInst?.acknowledge(msg.isError, msg.ackId, msg.isError ? null : msg.newId);

        if (msg.isError) {
            const sId = renderer_getCurrentServer();
            const cId = renderer_getCurrentChannel();
            this.servers[sId].channels[cId].messages =
                this.servers[sId].channels[cId].messages
                .filter(x => x.ackId != msg.ackId); // TODO: This won't work if the user switched channel
            
            delete this.pendingAcknowledgement[msg.ackId];
            return;
        }

        message.id = msg.newId;
        message.ackId = null;

        if (msg.authors) {
            message.authors = msg.authors;
            msgInst?.updateMessageAuthor(msgInst.element, this.getInfoFromIdList(message.authors));
        }

        if (msg.content) {
            message.content = msg.content;
            msgInst?.parseMessage(msgInst.element, message.content)
        }

        delete this.pendingAcknowledgement[msg.ackId];
    }

    addMyMessage(servId: number, chanId: number, msg) {
        const msgInst: Message = {
            id: -1,
            date: new Date(),
            authors: msg.authors.length === 0 ? [ this.mainUser ] : msg.authors,
            content: msg.content,
            attachments: [],

            ackId: msg.ackId
        };
        this.servers[servId].channels[chanId].messages.push(msgInst);
        this.messages.push(msgInst);
        this.pendingAcknowledgement[msg.ackId] = msgInst;
        return msgInst;
    }

    addMessageInternal(servId: number, chanId: number, msg): Message {
        const msgInst: Message = {
            id: msg.id,
            date: new Date((msg.sentAt - (new Date().getTimezoneOffset() * 60)) * 1000),
            authors: msg.authors,
            content: msg.content,
            attachments: msg.attachments,

            ackId: null
        };
        this.servers[servId].channels[chanId].messages.push(msgInst);
        this.messages.push(msgInst);
        return msgInst;
    }

    receiveMessage(msg) {
        const msgInst = this.addMessageInternal(msg.serverId, msg.channelId, msg);
        if (renderer_isCurrentChannel(this, msg.serverId, msg.channelId)) {
            renderer_sendMessageInternal(msgInst, MessageFlag.None);
        }
    }

    sendNotification(json) {
        // @ts-ignore
        if (!compatibility.notification()) return;
    
        let shouldSend: boolean;
    
        const notifSettings = preferences_getNotificationPingMode();
    
        // If user want no notification, we can just return
        if (notifSettings == NotificationPingMode.None) shouldSend = false;
        if (notifSettings == NotificationPingMode.All)
        {
            // Only ping once every 20s
            if (session_getLastNotificationReceived() === null ||
                new Date().getTime() - session_getLastNotificationReceived() > 20000)
            {
                session_setLastNotificationReceived(new Date().getTime());
                shouldSend = true;
            }
            else
            {
                shouldSend = false;
            }
        }
        else shouldSend = this.wasIMentionned(json.content);
    
        if (shouldSend) {
            const notifPrivacy = preferences_getNotificationDisplayMode();
    
            if (notifPrivacy == NotificationDisplayMode.ShowAll) {
                new window.Notification(`Message from ${this.getInfoFromIdList(json.authors).map(x => x.username)}`, {
                    body: json.content
                });
            }
            else
            {
                new window.Notification("New message received");
            }
        }
    }

    updateUserInfo(msg) {
        this.users[msg.id] = {
            id: msg.id,
            username: msg.username,
            color: msg.color,
            character: msg.character
        }

        if (msg.isMe) {
            this.mainUser = msg.id;
        }

        if (msg.isMyGroup) {
            if (!this.possibleUsers.includes(msg.id)) {
                this.possibleUsers.push(msg.id);
            }
        }
    }

    updateServerInfo(msg) {
        if (msg.id in this.servers) { // server was already instanciated, TODO: update
            return;
        }

        let serverInst: Server = {
            name: msg.name,
            channels: {},

            element: null,
            notification: null
        };
        this.servers[msg.id] = serverInst;

        for (const chan of msg.channels)
        {
            const chanInst: Channel = {
                name: chan.name,
                messages: []
            }
            this.servers[msg.id].channels[chan.id] = chanInst;
            for (const m of chan.messages) {
                this.addMessageInternal(msg.id, chan.id, m);
            }

            renderer_initDisplay(this, msg.id, chan.id);
        }
        
        // Spawn buttons for server selection // server was already instanciated, TODO: update
        const container = document.getElementById("servers");
        const template = document.getElementById("profile-template") as HTMLTemplateElement;
        const instance = template.content.cloneNode(true) as HTMLElement;

        const servBtn = instance.querySelector("button");

        const pfp = instance.querySelector("div");
        pfp.style = `background: rgb(${msg.color.r}, ${msg.color.g}, ${msg.color.b});`;
        pfp.innerHTML = msg.character;

        const name = instance.querySelector("p");
        name.innerHTML =  msg.name;

        if (renderer_isCurrentServer(this, msg.id)) servBtn.classList.add("is-primary");

        servBtn.addEventListener("click", _ => { // We clicked on a button to switch server...
            // Current channel become the first we find
            renderer_switchChannel(this, msg.id, msg.channels[0].id);
            renderer_showCurrentChannels();

            // Update server display UI
            document.querySelector("#servers > .is-primary").classList.remove("is-primary");
            this.servers[msg.id].element.classList.add("is-primary");

            document.getElementById("channel-list").classList.remove("is-hidden");
        });

        container.appendChild(instance);
        serverInst.element = container.lastElementChild as HTMLButtonElement;
        serverInst.notification = new Notification(serverInst.element, false);

        // Check if we have any unread message
        for (const chan of msg.channels)
        {
            // Update notifications
            if (chan.messages.length > 0 && chan.lastSeen < chan.messages[chan.messages.length - 1].sentAt)
            {
                serverInst.notification.addNotification(chan.id);
                console.log(`New message available in ${msg.name}/${chan.name}`)
            }
        }
    }

    /// Called once we received both users and channels info
    finalizeInit() {
        renderer_refreshMessageDisplay();
    }
}