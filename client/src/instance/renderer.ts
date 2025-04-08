import Network from "./network";
import Server from "../models/server";
import { renderer_initDisplay, renderer_isCurrentChannel, renderer_isCurrentServer, renderer_sendMessageInternal } from "../display/rendererManager";
import Channel from "../models/channel";
import User from "../models/user";
import Message from "../models/message";

export default class Renderer {
    network: Network;
    servers: { [id: number] : Server; };

    users: { [id: number]: User };
    mainUser: number;
    possibleUsers: number[];

    constructor(network: Network) {
        this.network = network;
        this.servers = {};
        this.users = {};

        this.mainUser = -1;
        this.possibleUsers = [];
    }

    sendSystemMessage(text) {
        // TODO
    }

    sendErrorMessage(text) {
        // TODO
    }

    clearAll() {

    }

    // Get a userinfo from an ID
    // If the ID doesn't exist, return a default user
    getInfoFromId(id: number): User {
        if (id in this.users) {
            return this.users[id];
        }
        return {
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

    addMyMessage(servId: number, chanId: number, msg) {
        const msgInst: Message = {
            date: new Date(),
            authors: msg.authors.length === 0 ? [ this.mainUser ] : msg.authors,
            content: msg.content,
            attachments: [],

            ackId: msg.ackId
        };
        this.servers[servId].channels[chanId].messages.push(msgInst);
        return msgInst;
    }

    addMessageInternal(servId: number, chanId: number, msg): Message {
        const msgInst: Message = {
            date: new Date((msg.sentAt - (new Date().getTimezoneOffset() * 60)) * 1000),
            authors: msg.authors,
            content: msg.content,
            attachments: msg.attachments,

            ackId: null
        };
        this.servers[servId].channels[chanId].messages.push(msgInst);
        return msgInst;
    }

    receiveMessage(msg) {
        const msgInst = this.addMessageInternal(msg.serverId, msg.channelId, msg);
        if (renderer_isCurrentChannel(this, msg.serverId, msg.channelId)) {
            renderer_sendMessageInternal(msgInst);
        }
    }

    updateUserInfo(msg) {
        this.users[msg.id] = {
            username: msg.username,
            color: msg.color,
            character: msg.character
        }

        if (msg.isMe) {
            this.mainUser = msg.id;
        }

        if (msg.isMyGroup) {
            this.possibleUsers.push(msg.id);
        }
    }

    updateServerInfo(msg) {
        this.servers[msg.id] = {
            name: msg.name,
            channels: {}
        };

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
        
        // Spawn buttons for server selection
        const id = `btn-serv-${msg.id}`;
        const server = document.getElementById(id);
        if (server) return; // Server already exists, TODO: update it

        const container = document.getElementById("servers");
        const template = document.getElementById("profile-template") as HTMLTemplateElement;
        const instance = template.content.cloneNode(true) as HTMLElement;

        const servBtn = instance.querySelector("button");
        servBtn.id = id;

        const pfp = instance.querySelector("div");
        pfp.style = `background: rgb(${msg.color.r}, ${msg.color.g}, ${msg.color.b});`;
        pfp.innerHTML = msg.character;

        const name = instance.querySelector("p");
        name.innerHTML =  msg.name;

        if (renderer_isCurrentServer(this, msg.id)) servBtn.classList.add("is-primary");

        container.appendChild(instance);
    }
}