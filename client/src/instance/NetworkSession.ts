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

    // Allow to refresh the React state
    refreshState: () => void;

    constructor(instance: string, token: string | null, refreshState: () => void)
    {
        this.instance = instance;
        this.token = token;
        this.socket = null;
        this.refreshState = refreshState;
        this.keepAliveInterval = null;

        this.isConnected = false;

        this.messaging = new MessagingSession();

        if (this.token === null) {
            this.openNetworkConnection(false);
        } else {
            this.checkToken();
        }
    }

    checkToken() { // As a connected user, we verify that our token is still valid
        fetch(`${this.instance}/api/auth/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(_ => {
            this.openNetworkConnection(false);
        })
        .catch(async (_) => {
            console.error(`Session for ${this.instance} expired`);
        });
    }

    openNetworkConnection(isGuest: boolean) {
        let endpoint = `${this.instance}/ws/${(isGuest ? "guest" : "")}`;

        if (isGuest) this.socket = new WebSocket(endpoint);
        else this.socket = new WebSocket(endpoint, ["client", this.token!]);
        const self = this;

        // Connection opened
        this.socket.addEventListener("open", (_) => {
            /*self.renderer.sendSystemMessage("Connected to server");
            for (const s of Object.values(this.renderer.servers)) {
                s.element.classList.remove("inactive");
                s.element.disabled = false;
            }*/

            if (self.keepAliveInterval !== null) clearInterval(self.keepAliveInterval);
            self.keepAliveInterval = setInterval(() => { // Heartbeat
                self.socket!.send(JSON.stringify({ type: 0 }));
            }, 10_000);

            this.isConnected = true;
            this.refreshState();
        });

        this.socket.addEventListener("close", async (_) => {
            /*self.renderer.clearAll();
            self.renderer.sendErrorMessage("Connection closed");
            for (const s of Object.values(this.renderer.servers)) {
                s.element.classList.add("inactive");
                s.element.disabled = true;
            }
            */
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s to not spam reconnections
            self.openNetworkConnection(isGuest);
        });

        this.socket.addEventListener("error", (e) => {
            //self.renderer.sendErrorMessage("Websocket error");
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
                    self.refreshState();
                    //if (json.data[0].type == 5) self.renderer.finalizeInit();
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
                    //self.renderer.acknowledgeMessage(json, renderer_getMessageByAckId(json.ackId));
                    break;

                case 7: // A message was modified
                    //self.renderer.editMessage(json, renderer_getMessageById(json.id))
                    break;
            }
        });
    }
}