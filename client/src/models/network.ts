import Renderer from "./display/renderer";

// Current message ID
let currId = 1;

// Store when the last notification was received
// Used when notification settings is set on all messages, to not spam the user
let lastNotificationReceived: number | null = null;

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

        this.websocketEndpoint = `ws${isSecure ? 's' : ''}://${website}/ws`;
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
        .then(async text => {
            this.token = text;
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

    resetConnection() {
        this.socket.close();
    }

    openMessageConnection() {
        document.getElementById("messages").innerHTML = "";

        this.renderer.sendSystemMessage(`Connecting...`);

        this.socket = new WebSocket(this.websocketEndpoint, ["client", this.token]);

        // Connection opened
        this.socket.addEventListener("open", (_) => {
            this.renderer.sendSystemMessage("Connected to server");

            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = setInterval(() => {
                this.socket.send(JSON.stringify({ type: 0 }));
            }, 10_000);
        });

        this.socket.addEventListener("close", async (_) => {
            this.renderer.clearAll();
            this.renderer.sendErrorMessage("Connection closed");
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.openMessageConnection();
        });

        this.socket.addEventListener("error", (e) => {
            this.renderer.sendErrorMessage("Websocket error");
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
                            /*case 2: // Message
                                sendMessage(c.sentAt, c.author, c.content);
                                break;*/
                            
                            case 4: // Server info
                                updateServerInfo(c);
                                break;

                            case 5: // User info
                                updateUserInfo(c);
                                break;
                            
                        }
                    }
                    await finishSetupAsync(); // TODO: Doesn't call it from here
                    break;

                case 2: // Message received
                    updateReceivedMessage(json);
                    if (isCurrentChannel(json.serverId, json.channelId))
                    {
                        sendSeenUpdate(json.serverId, json.channelId);
                        if (!await notification.isFocusedAsync()) { // We are in the current channel but window isn't focused, we send a notification
                            sendNotification(json);
                        }
                    }
                    else { // Whenever we are currently looking at the window or not, the message have lend in another channel so we send a notification
                        addPendingNotification(json.serverId, json.channelId);
                        sendNotification(json);
                    }
                    break;

                case 3: // Acknowledgement of a message sent
                    acknowledgeMessage(json);
                    break;

                case 7: // A message was modified
                    editMessage(json);
                    break;
            }
        });
    }
}