import { renderer_getMessageByAckId, renderer_getMessageById, renderer_isCurrentChannel, renderer_seeChannel } from "../display/rendererManager";
import Renderer from "./renderer";

// Represent the network connection of an instance

export default class Network
{
    website: string;
    websocketEndpoint: string;
    httpEndpoint: string;

    token: string | null;
    socket: WebSocket| null;

    renderer: Renderer;
    keepAliveInterval: NodeJS.Timeout | null;

    constructor(website: string, isSecure: boolean) {
        this.website = website;

        this.websocketEndpoint = `ws${isSecure ? 's' : ''}://${website}/ws/`;
        this.httpEndpoint =  `http${isSecure ? 's' : ''}://${website}/api`;

        this.token = null;
        this.socket = null;
        this.keepAliveInterval = null;

        this.renderer = new Renderer(this);
    }

    loginWithToken(token: string, onSuccess: () => void) {
        fetch(`${this.httpEndpoint}/auth/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(async _ => {
            this.token = token;
            this.openMessageConnection();

            onSuccess();
        })
        .catch((err) => {
            alert(`Login failed: ${err}`)
        });
    }

    loginWithPassword(pwd: string, onSuccess: () => void) {
        fetch(`${this.httpEndpoint}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pwd)
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(async text => {
            this.token = text;
            // @ts-ignore
            await filesystem.writeTokenAsync(this.token, this.website);
            this.openMessageConnection();

            onSuccess();
        })
        .catch((err) => {
            alert(`Login failed: ${err}`)
        });
    }

    getAttachmentOverNetwork(servId: number, chanId: number, msgId: number, onDone: (blob: Blob) => void) {
        fetch(`${this.httpEndpoint}/attachment/get/${servId}/${chanId}/${msgId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(resp => resp.ok ? resp.blob() : Promise.reject(`${resp.status}`))
        .then(blob => onDone(blob))
        .catch((err) => { this.renderer.sendErrorMessage("Attachment get failed: " + err); });
    }

    sendAttachmentOverNetwork(servId: number, chanId: number, msgId: number, files: any[]) {
        const data = new FormData();
        for (const f of files) {
            data.append("files", f);
        }
    
        fetch(`${this.httpEndpoint}/attachment/attach/${servId}/${chanId}/${msgId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: data
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(text => {})
        .catch((err) => { this.renderer.sendErrorMessage("Attachment upload failed: " + err) });
    }

    downloadChanExport(chanName: string, servId: number, chanId: number) {
        fetch(`${this.httpEndpoint}/export/${servId}/${chanId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(text => {
            var e = document.createElement('a');
            // https://stackoverflow.com/questions/65050679/javascript-a-simple-way-to-save-a-text-file/73775602#73775602
            e.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            e.setAttribute('download', `export-${chanName}.md`);
            e.style.display = 'none';
            document.body.appendChild(e);
            e.click();
            document.body.removeChild(e);
        })
        .catch((err) => { this.renderer.sendErrorMessage("Export failed: " + err) });
    }

    resetConnection() {
        this.socket.close();
    }

    sendMessage(msg) {
        this.socket.send(JSON.stringify(msg));
    }

    openMessageConnection() {
        document.getElementById("messages").innerHTML = "";

        this.renderer.sendSystemMessage(`Connecting...`);

        this.socket = new WebSocket(this.websocketEndpoint, ["client", this.token]);

        const self = this;
        // Connection opened
        this.socket.addEventListener("open", (_) => {
            self.renderer.sendSystemMessage("Connected to server");
            for (const s of Object.values(this.renderer.servers)) {
                s.element.classList.remove("inactive");
                s.element.disabled = false;
            }

            clearInterval(self.keepAliveInterval);
            self.keepAliveInterval = setInterval(() => {
                self.socket.send(JSON.stringify({ type: 0 }));
            }, 10_000);
        });

        this.socket.addEventListener("close", async (_) => {
            self.renderer.clearAll();
            self.renderer.sendErrorMessage("Connection closed");
            for (const s of Object.values(this.renderer.servers)) {
                s.element.classList.add("inactive");
                s.element.disabled = true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            self.openMessageConnection();
        });

        this.socket.addEventListener("error", (e) => {
            self.renderer.sendErrorMessage("Websocket error");
        });

        // Listen for messages
        this.socket.addEventListener("message", async function(event) {
            const json = JSON.parse(event.data);

            switch (json.type) {
                case 0: // Ack
                    break;

                case 1: // Data received is an array
                    for (const c of json.data) {
                        switch (c.type)
                        {
                            case 4: // Server info
                                self.renderer.updateServerInfo(c);
                                break;

                            case 5: // User info
                                self.renderer.updateUserInfo(c);
                                break;
                            
                        }
                    }
                    if (json.data[0].type == 5) self.renderer.finalizeInit();
                    break;

                case 2: // Message received
                    self.renderer.receiveMessage(json);
                    if (renderer_isCurrentChannel(self.renderer, json.serverId, json.channelId))
                    {
                        // @ts-ignore
                        if (!await notification.isFocusedAsync()) { // We are in the current channel but window isn't focused, we send a notification
                            self.renderer.servers[json.serverId].notification.addNotification(json.channelId);
                            self.renderer.sendNotification(json);
                        } else {
                            renderer_seeChannel()
                        }
                    }
                    else { // Whenever we are currently looking at the window or not, the message have lend in another channel so we send a notification
                        self.renderer.servers[json.serverId].notification.addNotification(json.channelId);
                        self.renderer.sendNotification(json);
                    }
                    break;

                case 3: // Acknowledgement of a message sent
                    self.renderer.acknowledgeMessage(json, renderer_getMessageByAckId(json.ackId));
                    break;

                case 7: // A message was modified
                    self.renderer.editMessage(json, renderer_getMessageById(json.id))
                    break;
            }
        });
    }
}