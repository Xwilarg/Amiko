import type Channel from "../model/Channel";
import type Message from "../model/Message";
import type Server from "../model/Server";
import type User from "../model/User";
import type NetworkSession from "./NetworkSession";

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

    systemId: number; // Keep track of IDs for system messages

    constructor(s: NetworkSession) {
        this.session = s;

        this.systemId = -1;

        this.users = [];
        this.mainUser = null;
        this.possibleUsers = [];

        this.servers = {};
        this.pendingAcknowledgement = {};
    }

    // Add a message to the list of messages
    addMessageInternal(servId: number, chanId: number, msg: any): Message {
        const msgInst: Message = {
            id: msg.id,
            date: new Date((msg.sentAt - (new Date().getTimezoneOffset() * 60)) * 1000),
            authors: msg.authors,
            content: msg.content,
            attachments: msg.attachments,

            ackId: null
        };
        this.servers[servId].channels[chanId].messages.push(msgInst);

        return msgInst;
    }

    receiveMessage(msg: any) {
        this.session.renderingContext.sendMessage({
            id: msg.id,
            date: new Date((msg.sentAt - (new Date().getTimezoneOffset() * 60)) * 1000),
            authors: msg.authors,
            content: msg.content,
            attachments: msg.attachments,

            ackId: null
        }, "None");
    }

    addPendingMessage(servId: number, chanId: number, msg: any): Message {
        const msgInst: Message = {
            id: null,
            date: new Date(),
            authors: msg.authors,
            content: msg.content,
            attachments: [],

            ackId: msg.ackId
        };
        this.servers[servId].channels[chanId].messages.push(msgInst);

        this.pendingAcknowledgement[msg.ackId] = msgInst;

        return msgInst;
    }

    acknowledgeMessage(ackId: number, newId: number) {
        const msg = this.pendingAcknowledgement[ackId];
        msg.id = newId;
        msg.ackId = null;
        delete this.pendingAcknowledgement[ackId];
    }

    sendSystemMessage(text: string) {
        this.session.renderingContext.sendMessage({
            id: this.systemId--,
            date: new Date(),
            authors: null,
            content: text,
            attachments: [],

            ackId: null
        }, "IsSystem");
    }

    sendErrorMessage(text: string) {
        this.session.renderingContext.sendMessage({
            id: this.systemId--,
            date: new Date(),
            authors: null,
            content: text,
            attachments: [],

            ackId: null
        }, "IsError");
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
            s.channels[msg.chanId] = {
                name: msg.name,
                description: undefined,
                messages: []
            };
        }
        else if (msg.updateType === 1) { // Edition
            let c = s.channels[msg.chanId];
            if (msg.name !== null) c.name = msg.name;
        } else { // Deletion
            let ctx = this.session.renderingContext;
            let willBeDeleted = ctx.currServ == msg.servId && ctx.currChannel === msg.chanId;
            delete s.channels[msg.chanId];
            if (willBeDeleted) {
                ctx.currChannel = parseInt(Object.keys(this.servers[ctx.currServ].channels)[0]);
                this.session.renderingContext.replaceMessages();
            }
        }
    }

    updateServerInfo(msg: any) {
        if (msg.updateType === 0) { // Creation
            let s = this.servers[msg.id];
            if (msg.color !== null) s.color = msg.color;
            if (msg.character !== null) s.character = msg.character;
            if (msg.name !== null) s.name = msg.name;
            if (msg.allowsGuest !== null) s.allowsGuest = msg.allowsGuest;
            if (msg.isEphemeral !== null) s.isEphemeral = msg.isEphemeral;
        }
        else if (msg.updateType === 1) { // Edition
            if (msg.name !== null) this.servers[msg.id].name = msg.name;
        } else { // Deletion
            let ctx = this.session.renderingContext;
            let willBeDeleted = ctx.currServ === msg.id; // TODO: Delete message being sent
            delete this.servers[msg.id];
            if (willBeDeleted) {
                ctx.currServ = parseInt(Object.keys(this.servers)[0]);
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