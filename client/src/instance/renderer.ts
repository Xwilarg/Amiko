import Network from "./network";
import Server from "../models/server";
import { renderer_initDisplay, renderer_isCurrentServer } from "../display/rendererManager";
import Channel from "../models/channel";
import User from "../models/user";

export default class Renderer {
    network: Network;
    servers: { [id: number] : Server; };
    users: { [id: number]: User };

    constructor(network: Network) {
        this.network = network;
        this.servers = {};
        this.users = {};
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

    updateUserInfo(msg) {
        this.users[msg.id] = {
            username: msg.username,
            color: msg.color,
            character: msg.character
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
            chanInst.messages = chan.messages.map(x => {
                return {
                    date: new Date((x.sentAt - (new Date().getTimezoneOffset() * 60)) * 1000),
                    authors: msg.authors,
                    content: msg.content,
                    attachments: msg.attachments
                }
            });

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