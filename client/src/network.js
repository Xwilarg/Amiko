import { getUsernameFromId, sendMyMessage, sendSystemMessage, updateReceivedMessage, updateServerInfo, updateUserInfo } from "./renderer";

const apiTarget = "amiko.zirk.eu";
const isSecure = true;
/*
const apiTarget = "localhost:5129";
const isSecure = false;
*/

let socket;
let networkInterval = null;

// Current message ID
let currId = 0;

function createWebsocketUrl() {
    return `ws${isSecure ? 's' : ''}://${apiTarget}/ws`
}
export function createHttpUrl(endpoint) {
    return `http${isSecure ? 's' : ''}://${apiTarget}/api/${endpoint}`
}

export function sendMessageFromInput(content, servId, chanId) {
    var newMsg = {
        type: 2,
        content: content,
        id: currId,
        serverId: servId,
        channelId: chanId
    };
    socket.send(JSON.stringify(newMsg));
    sendMyMessage(newMsg, content, currId);
    currId++;
}

export function openMessageConnection(token) {
    document.getElementById("send-message").disabled = true;
    document.getElementById("messages").innerHTML = "";

    // TODO: Move on refresh
    sendSystemMessage(`Chrome v${versions.chrome()}, Node v${versions.node()}, Electron v${versions.electron()}`);
    sendSystemMessage(`Connecting...`);

    socket = new WebSocket(createWebsocketUrl(), ["client", token]);

    // Connection opened
    socket.addEventListener("open", (_) => {
        sendSystemMessage("Connected to server");

        if (networkInterval !== null)
        {
            clearInterval(networkInterval);
        }
        networkInterval = setInterval(() => {
            socket.send(JSON.stringify({ type: 0 }));
        }, 10_000);
    });

    socket.addEventListener("close", (_) => {
        openMessageConnection(token);
    });

    socket.addEventListener("error", (e) => {
        console.log(e);
    });

    // Listen for messages
    socket.addEventListener("message", async function(event) {
        const json = JSON.parse(event.data);

        console.log(`Received ${json.type}`);
        switch (json.type) {
            case 0: // Ack
                break;

            case 1: // Data received is an array
                for (const c of json.data) {
                    console.log(`(Of type ${c.type})`);
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
                break;

            case 2: // Message received
                updateReceivedMessage(json);
                if (!await notification.isFocusedAsync()) {
                    new window.Notification(`Message from ${getUsernameFromId(json.author)}`, {
                        body: json.content
                    });
                }
                break;

            case 3: // Acknowledgement of a message sent
                document.querySelector(`.message-${json.id}`).classList.remove("sending");
                if (json.isError) document.querySelector(`.message-${json.id}`).classList.add("error");
                break;
        }
    });
}