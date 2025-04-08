import Network from "./network";
import Server from "../models/server";
import { renderer_initDisplay, renderer_isCurrentServer } from "../display/rendererManager";

export default class Renderer {
    network: Network;
    servers: { [id: number] : Server; };

    constructor(network: Network) {
        this.network = network;
        this.servers = {};
    }

    sendSystemMessage(text) {
        // TODO
    }

    sendErrorMessage(text) {
        // TODO
    }

    clearAll() {

    }

    updateServerInfo(msg) {
        this.servers[msg.id] = {
            name: msg.name,
            channels: {}
        };

        for (const chan of msg.channels)
        {
            this.servers[msg.id].channels[chan.id] = {
                name: chan.name,
                messages: chan.messages
            };

            renderer_initDisplay(this, msg.id, chan.id);
        }
        
        // Spawn buttons for server selection
        const container = document.getElementById("servers");
        const template = document.getElementById("profile-template") as HTMLTemplateElement;
        const instance = template.content.cloneNode(true) as HTMLElement;

        const servBtn = instance.querySelector("button");
        servBtn.id = `btn-serv-${msg.id}`;

        const pfp = instance.querySelector("div");
        pfp.style = `background: rgb(${msg.color.r}, ${msg.color.g}, ${msg.color.b});`;
        pfp.innerHTML = msg.character;

        const name = instance.querySelector("p");
        name.innerHTML =  msg.name;

        if (renderer_isCurrentServer(this, msg.id)) servBtn.classList.add("is-primary");

        container.appendChild(instance);
    }
}