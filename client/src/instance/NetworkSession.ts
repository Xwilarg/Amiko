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

    // Allow to refresh the React state
    refreshState: () => void;
    renderingContext: SessionRenderingContext;

    constructor(instance: string, token: string | null, renderingContext: SessionRenderingContext, refreshState: () => void, t: TFunction<"translation", undefined>)
    {
        this.t = t;

        this.instance = instance;
        this.token = token;
        this.socket = null;
        this.keepAliveInterval = null;

        this.renderingContext = renderingContext;

        this.isConnected = false;

        this.messaging = new MessagingSession(this);
        this.refreshState = refreshState;

        if (this.token === null) {
            this.#openNetworkConnection(false);
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
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(_ => {
            this.#openNetworkConnection(false);
        })
        .catch(async (e) => {
            console.error(`Session for ${this.instance} expired`);
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

    #openNetworkConnection(isGuest: boolean) {
        this.renderingContext.clearAllMessages();

        let endpoint = `${this.instance}/ws/${(isGuest ? "guest" : "")}`;

        if (isGuest) this.socket = new WebSocket(endpoint);
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
                                self.messaging.updateServerInfo(c);
                                break;

                            case 5: // User info
                                self.messaging.updateUserInfo(c);
                                break;
                            
                        }
                    }
                    if (json.data[0].type == 5 && self.renderingContext.isCurrentInstance(self)) {
                        let servId = parseInt(Object.keys(self.messaging.servers)[0]);
                        let chanId = parseInt(Object.keys(self.messaging.servers[servId].channels)[0]);

                        self.renderingContext.currServ = servId;
                        self.renderingContext.currChannel = chanId;

                        self.renderingContext.setMessages(self.messaging.servers[servId].channels[chanId].messages);

                        if (Object.keys(self.messaging.users).length === 1) {
                            let intro = "";
                            intro += `# ${self.t("intro.welcome1")}\n`;
                            intro += `${self.t("intro.welcome2")}\n`;
                            intro += `- ${self.t("intro.welcome3")} <span class="material-symbols-outlined">person_add</span>\n`;
                            intro += `- ${self.t("intro.welcome4")} <span class="material-symbols-outlined">admin_panel_settings</span>\n\n`;
                            intro += `*${self.t("intro.welcome5")}*`
                            self.messaging.sendSystemMessage(intro);
                        }

                        self.refreshState();
                    }
                    break;

                case 2: // Message received
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
            }
        });
    }
}