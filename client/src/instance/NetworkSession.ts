import type { TFunction } from "i18next";
import type SessionRenderingContext from "../context/SessionRenderingContext";
import MessagingSession from "./MessagingSession";

export default class NetworkSession
{
    // Connection info
    instance: string;
    token: string | null;
    socket: WebSocket | null;
    keepAliveInterval: NodeJS.Timeout | null;

    // Is the socket connection established
    isConnected: boolean;

    messaging: MessagingSession;

    t: TFunction<"translation", undefined>;

    renderingContext: SessionRenderingContext;

    constructor(instance: string, token: string | null, renderingContext: SessionRenderingContext, t: TFunction<"translation", undefined>)
    {
        this.t = t;

        this.instance = instance;
        this.token = token;
        this.socket = null;
        this.keepAliveInterval = null;

        this.renderingContext = renderingContext;

        this.isConnected = false;

        this.messaging = new MessagingSession(this);
    }

    connect() {
        if (this.socket) {
            this.socket.close(); // Socket already exist so we just force it to reconnect
            return;
        }

        if (this.token === "guest") {
            this.#openNetworkConnection(true);
        } else {
            this.#checkToken();
        }
    }

    #checkToken() { // As a connected user, we verify that our token is still valid
        fetch(`${this.instance}/api/auth/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(resp.status))
        .then(_ => {
            this.#openNetworkConnection(false);
        })
        .catch(async (e) => {
            console.error(`Session for ${this.instance} expired`);
            if (e === 401 && this.renderingContext.sessions.length === 1) {
                // Session expired and we were only connected to one instance
                // So only thing we can do is login again
                window.location.href = "/#/login";
            }
        });
    }

    getInvitationLink(onSuccess: (invite: string) => void) {
        fetch(`${this.instance}/api/invitation/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(text => {
            onSuccess(text);
        })
        .catch(async (e) => {
            alert(this.t("invitation.error"))
        });
    }

    sendNetworkMessage(msg: any) {
        this.socket?.send(JSON.stringify(msg));
    }

    sendApiMessage(msg: any, endpoint: string, method: string) {
        fetch(`${this.instance}/api/${endpoint}`, {
            method: method,
            body: JSON.stringify(msg),
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(text => {})
        .catch(async (e) => {
            alert(`API request to ${endpoint} failed: ${e}`)
        });
    }

    sendApiMessageNoPayload(endpoint: string, method: string) {
        fetch(`${this.instance}/api/${endpoint}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(text => {})
        .catch(async (e) => {
            alert(`API request to ${endpoint} failed: ${e}`)
        });
    }

    #openNetworkConnection(isGuest: boolean) {
        this.renderingContext.clearAllMessages();

        let endpoint = `${this.instance}/ws/${(isGuest ? "guest" : "")}`;

        if (isGuest) this.socket = new WebSocket(endpoint, ["client", "guest"]);
        else this.socket = new WebSocket(endpoint, ["client", this.token!]);
        const self = this;
        
        self.messaging.sendSystemMessage(this.t("socket.connecting"));

        // Connection opened
        this.socket.addEventListener("open", (_) => {
            self.messaging.sendSystemMessage(this.t("socket.connected"));
            /*
            for (const s of Object.values(this.renderer.servers)) {
                s.element.classList.remove("inactive");
                s.element.disabled = false;
            }*/

            /*if (self.keepAliveInterval !== null) clearInterval(self.keepAliveInterval);
            self.keepAliveInterval = setInterval(() => { // Heartbeat
                self.socket!.send(JSON.stringify({ type: 0 }));
            }, 10_000);*/

            this.isConnected = true;
        });

        this.socket.addEventListener("close", async (_) => {
            self.messaging.sendErrorMessage(this.t("socket.closed"));
            /*self.renderer.clearAll();
            for (const s of Object.values(this.renderer.servers)) {
                s.element.classList.add("inactive");
                s.element.disabled = true;
            }
            */
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s to not spam reconnections
            self.#openNetworkConnection(isGuest);
        });

        this.socket.addEventListener("error", (e) => {
            self.messaging.sendErrorMessage(this.t("socket.closed"));
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
                                self.messaging.addServerInfo(c);
                                break;

                            case 5: // User info
                                self.messaging.addUserInfo(c);
                                break;
                            
                        }
                    }
                    if ((json.data.length === 0 || json.data[0].type == 5) && self.renderingContext.isCurrentInstance(self)) {
                        const servKeys = Object.keys(self.messaging.servers);
                        if (servKeys.length > 0) {
                            let servId = parseInt(servKeys[0]);
                            var chanKeys = Object.keys(self.messaging.servers[servId].channels);
                            if (chanKeys.length > 0) {
                                let chanId = parseInt(chanKeys[0]);
                                self.renderingContext.currChannel = chanId;

                                // Serv and channel exist, we display the messages
                                self.renderingContext.setMessages(self.messaging.servers[servId].channels[chanId].messages);
                            } else {
                                self.renderingContext.currChannel = null;
                            }

                            self.renderingContext.currServ = servId;
                        } else {
                            self.renderingContext.currServ = null;
                            self.renderingContext.currChannel = null;
                        }

                        if (Object.keys(self.messaging.users).length === 1 && self.renderingContext.getCurrentServer()?.allowsGuest !== true) {
                            let intro = "";
                            intro += `# ${self.t("intro.welcome1")}\n`;
                            intro += `${self.t("intro.welcome2")}\n`;
                            intro += `- ${self.t("intro.welcome3")} <span class="material-symbols-outlined">person_add</span>\n`;
                            intro += `- ${self.t("intro.welcome4")} <span class="material-symbols-outlined">admin_panel_settings</span>\n\n`;
                            intro += `*${self.t("intro.welcome5")}*`
                            self.messaging.sendSystemMessage(intro);
                        }

                        self.renderingContext.refreshServerDisplayState!(); // Update server bar with new info we have
                        self.renderingContext.refreshNavbar!(); // Depending of our permissions, navbar might need refresh too
                    }
                    break;

                case 2: // Message received
                    self.messaging.receiveMessage(json);
                    /*self.renderer.receiveMessage(json);
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
                    }*/
                    break;

                case 3: // Acknowledgement of a message sent
                    self.messaging.acknowledgeMessage(json.ackId, json.newId);
                    // @ts-ignore
                    self.renderingContext.refMsg.current.refresh();
                    break;

                case 7: // A message was modified
                    //self.renderer.editMessage(json, renderer_getMessageById(json.id))
                    break;

                case 8: // A server settings were modified
                    self.messaging.updateServerInfo(json);
                    self.renderingContext.refreshServerDisplayState!();
                    self.renderingContext.refreshNavbar!();
                    break;

                case 9: // A channel settings were modified
                    self.messaging.updateChannelInfo(json);
                    self.renderingContext.refreshServerDisplayState!();
                    self.renderingContext.refreshServerSettings?.();
                    break;

                case 10: // A user settings were modified
                    self.messaging.updateUserInfo(json); // todo: refresh messages
                    // @ts-ignore
                    self.renderingContext.refMsg.current.refresh();
                    break;
            }
        });
    }
}