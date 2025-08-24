import type Channel from "../model/Channel";
import type Message from "../model/Message";
import type Server from "../model/Server";
import type User from "../model/User";
import type NetworkSession from "./NetworkSession";

export interface MessageAttachment
{
    serverId: number;
    channelId: number;
    files: File[];
}

export default class MessagingSession
{
    session: NetworkSession;

    // All the users of this instance
    users: { [id: number]: User; };
    // User holding the claim for us
    // This mean even if we are currently speaking as a alt user, this still represent the one holding the password
    // Can be null if we are a guest account
    mainUser: number | null;
    // All alt users we can speak with
    possibleUsers: number[];

    // All the servers accessible by this instance
    servers: { [id: number] : Server; };
    // Messages we sent but weren't acknowledged by the server yet
    pendingAcknowledgement: { [id: number] : Message; };
    // Last channels we visited
    lastVisitedChannels: { [servId: number] : number | null };

    systemId: number; // Keep track of IDs for system messages

    // Attachments that are being sent
    attachments: { [id: number] : MessageAttachment; };
    currAttachments: File[];

    // Store when the last notification was received
    // Used when notification settings is set on all messages, to not spam the user
    lastNotificationReceived: number;

    constructor(s: NetworkSession) {
        this.session = s;

        this.systemId = -1;

        this.users = [];
        this.mainUser = null;
        this.possibleUsers = [];

        this.servers = {};
        this.pendingAcknowledgement = {};
        this.lastVisitedChannels = {};

        this.attachments = {};
        this.currAttachments = [];

        this.lastNotificationReceived = 0;
    }

    // Add a message to the list of messages
    addMessageInternal(servId: number, chanId: number, msg: any): Message {
        const msgInst: Message = {
            id: msg.id,
            date: new Date((msg.sentAt - (new Date().getTimezoneOffset() * 60)) * 1000),
            authors: msg.authors,
            content: msg.content,
            attachments: msg.attachments,

            ackId: null,
            flag: "None"
        };
        this.servers[servId].channels[chanId].messages.push(msgInst);

        return msgInst;
    }

    receiveMessage(msg: any) {
        const msgInst: Message = {
            id: msg.id,
            date: new Date((msg.sentAt - (new Date().getTimezoneOffset() * 60)) * 1000),
            authors: msg.authors,
            content: msg.content,
            attachments: msg.attachments,

            ackId: null,
            flag: "None"
        };
        this.servers[msg.serverId].channels[msg.channelId].messages.push(msgInst);

        this.session.renderingContext.sendMessage(msg);
    }

    addPendingMessage(servId: number, chanId: number, msg: any): Message {
        const msgInst: Message = {
            id: null,
            date: new Date(),
            authors: msg.authors,
            content: msg.content,
            attachments: [],

            ackId: msg.ackId,
            flag: "None"
        };
        this.servers[servId].channels[chanId].messages.push(msgInst);

        this.pendingAcknowledgement[msg.ackId] = msgInst;

        return msgInst;
    }

    acknowledgeMessage(ackId: number, newId: number, isError: boolean) {
        const msg = this.pendingAcknowledgement[ackId];
        // TODO: ack msg
        msg.id = newId;
        msg.ackId = null;
        delete this.pendingAcknowledgement[ackId];

         if (isError) {
            msg.flag = "IsError";

            // Message wasn't sent so we don't send the attachments
            this.discardAttachment(ackId);
        } else {
            const files = this.getAttachment(ackId);
            if (files && files.length > 0) {
                this.session.sendAttachmentOverNetwork(this.session.renderingContext.currServ!, this.session.renderingContext.currChannel!, newId, files);
            }
            this.discardAttachment(ackId);
        }
        // @ts-ignore
        this.session.renderingContext.refMsg.current.updateSingleMessage(newId, msg);
    }

    sendSystemMessage(text: string) {
        this.session.renderingContext.sendMessage({
            id: this.systemId--,
            date: new Date(),
            authors: null,
            content: text,
            attachments: [],

            ackId: null,
            flag: "IsSystem"
        });
    }

    sendErrorMessage(text: string) {
        this.session.renderingContext.sendMessage({
            id: this.systemId--,
            date: new Date(),
            authors: null,
            content: text,
            attachments: [],

            ackId: null,
            flag: "IsError"
        });
    }

    updateUserInfo(msg: any) {
        let u = this.users[msg.id];
        if (msg.color !== null) u.color = msg.color;
        if (msg.character !== null) u.character = msg.character;
        if (msg.username !== null) u.username = msg.username;
    }

    updateChannelInfo(msg: any) {
        let s = this.servers[msg.servId];
        if (msg.updateType === 0) { // Creation
            let ctx = this.session.renderingContext;
            s.channels[msg.chanId] = {
                name: msg.name,
                description: undefined,
                messages: []
            };
            if (ctx.currChannel === null) {
                ctx.currChannel = msg.chanId;
                this.session.renderingContext.replaceMessages();
            }
            if (this.lastVisitedChannels[msg.servId] === null) {
                this.lastVisitedChannels[msg.servId] = msg.chanId;
            }
        }
        else if (msg.updateType === 1) { // Edition
            let c = s.channels[msg.chanId];
            if (msg.name !== null) c.name = msg.name;
        } else { // Deletion
            let ctx = this.session.renderingContext;
            let willBeDeleted = ctx.currServ == msg.servId && ctx.currChannel === msg.chanId;
            delete s.channels[msg.chanId];
            if (willBeDeleted) {
                const keys = ctx.currServ === null ? [] : Object.keys(this.servers[ctx.currServ].channels);
                ctx.currChannel = keys.length === 0 ? null : parseInt(keys[0]);
                if (keys.length === 0) {
                    this.lastVisitedChannels[msg.servId] = null;
                }
                this.session.renderingContext.replaceMessages();
            }
        }
    }

    updateServerInfo(msg: any) {
        if (msg.updateType === 0) { // Creation
            let ctx = this.session.renderingContext;
            let needServUpdate = ctx.currServ === null;
            this.addServerInfo(msg);
            if (needServUpdate) {
                ctx.currServ = msg.id;
                this.session.renderingContext.refreshNavbar!();
            }
        }
        else if (msg.updateType === 1) { // Edition
            let s = this.servers[msg.id];
            if (msg.color !== null) s.color = msg.color;
            if (msg.character !== null) s.character = msg.character;
            if (msg.name !== null) s.name = msg.name;
            if (msg.allowsGuest !== null) s.allowsGuest = msg.allowsGuest;
            if (msg.isEphemeral !== null) s.isEphemeral = msg.isEphemeral;
        } else { // Deletion
            let ctx = this.session.renderingContext;
            let willBeDeleted = ctx.currServ === msg.id; // TODO: Delete message being sent
            delete this.servers[msg.id];
            if (willBeDeleted) {
                const keys = Object.keys(this.servers);
                if (keys.length > 0) {
                    ctx.currServ = parseInt(Object.keys(this.servers)[0]);
                    ctx.currChannel = this.lastVisitedChannels[ctx.currServ];
                } else {
                    ctx.currServ = null;
                    ctx.currChannel = null;
                    this.session.renderingContext.refreshNavbar!();
                }
                this.lastVisitedChannels[msg.id] = null;
                this.session.renderingContext.replaceMessages();
            }
        }
    }

    addUserInfo(msg: any) {
        if (msg.id in this.users) {
            return;
        }

        this.users[msg.id] = {
            id: msg.id,
            username: msg.username,
            color: msg.color,
            character: msg.character,
            isAdmin: msg.isAdmin
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

    addServerInfo(msg: any) {
        if (msg.id in this.servers) {
            return;
        }

        let serverInst: Server = {
            name: msg.name,
            channels: {},

            color: msg.color,
            character: msg.character,

            isEphemeral: msg.isEphemeral,
            allowsGuest: msg.allowsGuest
            //notification: null // TODO: Don't forget to uncomment
        };
        this.servers[msg.id] = serverInst;

        if (!msg.channels) {
            this.lastVisitedChannels[msg.id] = null;
        } else {
            this.lastVisitedChannels[msg.id] = msg.channels.length > 0 ? msg.channels[0].id : null;
            for (const chan of msg.channels)
            {
                const chanInst: Channel = {
                    name: chan.name,
                    description: chan.description,
                    messages: []
                }
                this.servers[msg.id].channels[chan.id] = chanInst;
                for (const m of chan.messages) {
                    this.addMessageInternal(msg.id, chan.id, m);
                }
            }
        }
    }

    editMessage(msg: any) {
        let target = this.servers[msg.serverId].channels[msg.channelId].messages.find(x => x.id === msg.id);
        target!.attachments = msg.attachments;
        // @ts-ignore
        this.session.renderingContext.refMsg.current.updateSingleMessage(msg.id, msg);
    }

    // User data

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
            character: '?',
            isAdmin: false
        };
    }

    getInfoFromIdList(ids: number[]): User[] {
        let users = [];
        for (let id of ids) {
            users.push(this.getInfoFromId(id));
        }
        return users;
    }

    // Notification

    // Does the content checked have @XXXX
    // Where XXXX is one of our possible user
    wasIMentionned(text: string): boolean {
        const infos = this.getInfoFromIdList(this.possibleUsers);
        return infos.some(x => text.toLowerCase().includes(`@${x.username.toLowerCase()}`));
    }

    sendNotification(json: any) {
        // @ts-ignore
        if (!compatibility.notification()) return;

        let shouldSend: boolean;

        const notifSettings = this.session.renderingContext.getPingMode();

        // If user want no notification, we can just return
        if (notifSettings == "None") shouldSend = false;
        if (notifSettings == "AllMessages")
        {
            // Only ping once every 20s
            if (new Date().getTime() - this.lastNotificationReceived > 20000)
            {
                this.lastNotificationReceived = new Date().getTime();
                shouldSend = true;
            }
            else
            {
                shouldSend = false;
            }
        }
        else shouldSend = this.wasIMentionned(json.content);

        if (shouldSend) {
            const hideNotification = this.session.renderingContext.getHideNotification();

            if (hideNotification) {
                new window.Notification(this.session.t("notification.newMessageHidden"));
            }
            else
            {
                new window.Notification(this.session.t("notification.newMessageShown", {authors: this.getInfoFromIdList(json.authors).map(x => x.username).join(", ")}), {
                    body: json.content
                });
            }
        }
    }

    // Attachment management

    setAttachment(files: FileList | null) {
        this.currAttachments = files ? [...files] : [];

        this.session.renderingContext.refreshMessageInput!();
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

    getAttachment(tempId: number): File[] | null {
        if (tempId in this.attachments) {
            return this.attachments[tempId].files;
        } else {
            return [];
        }
    }

    discardAttachment(tempId: number) {
        if (tempId in this.attachments) {
            delete this.attachments[tempId];
        }
    }
}