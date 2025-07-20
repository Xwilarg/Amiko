import type Channel from "../model/channel";
import type Message from "../model/message";
import type Server from "../model/server";
import type User from "../model/user";

export default class MessagingSession
{
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

    constructor() {
        this.users = [];
        this.mainUser = null;
        this.possibleUsers = [];

        this.messages = [];
        this.servers = {};
        this.pendingAcknowledgement = [];
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
        this.messages.push(msgInst);
        return msgInst;
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
                this.addMessageInternal(msg.id, chan.id, m);
            }

            //renderer_initDisplay(this, msg.id, chan.id);
        }
    }
}