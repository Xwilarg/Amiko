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
    mainUser: number | null;
    // All alt users we can speak with
    possibleUsers: number[];

    // TODO
    messages: Message[];
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

        this.messages = [];
        this.servers = {};
        this.pendingAcknowledgement = [];
    }

    // Add a message to the list of messages
    #addMessageInternal(servId: number, chanId: number, msg: any): Message {
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

    updateServerInfo(msg: any) {
        if (msg.id in this.servers) { // server was already instanciated, TODO: update
            return;
        }

        let serverInst: Server = {
            name: msg.name,
            channels: {},

            color: msg.color,
            character: msg.character,

            isEphemeral: msg.isEphemeral,
            allowGuest: msg.allowGuest
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
                this.#addMessageInternal(msg.id, chan.id, m);
            }

            if (this.session.renderingContext.isCurrentChannel(this.session, msg.id, chan.id)) {
                this.session.renderingContext.setMessages(this.servers[msg.id].channels[chan.id].messages);
            }
        }
    }
}