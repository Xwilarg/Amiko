const apiTarget = "amiko.zirk.eu";
const isSecure = true;
/*
const apiTarget = "localhost:5129";
const isSecure = false;
*/

let socket;

function createWebsocketUrl() {
    return `ws${isSecure ? 's' : ''}://${apiTarget}/ws`
}
function createHttpUrl(endpoint) {
    return `http${isSecure ? 's' : ''}://${apiTarget}/api/${endpoint}`
}

function openMessageConnection() {
    document.getElementById("send-message").disabled = true;
    document.getElementById("messages").innerHTML = "";
    sendSystemMessage(`Chrome v${versions.chrome()}, Node v${versions.node()}, Electron v${versions.electron()}`);
    sendSystemMessage(`Connecting...`);

    socket = new WebSocket(createWebsocketUrl(), ["client", token]);

    // Connection opened
    socket.addEventListener("open", (_) => {
        sendSystemMessage("Connected to server");
        document.getElementById("send-message").disabled = false;
    });

    socket.addEventListener("close", (_) => {
        openMessageConnection();
    });

    socket.addEventListener("error", (e) => {
        console.log(e);
    });

    // Listen for messages
    socket.addEventListener("message", async function(event) {

        const json = JSON.parse(event.data);

        console.log(`Received ${json.type}`);
        switch (json.type) {
            case 0: // Data received is an array
                for (const c of json.data) {
                    switch (json.data[0].type)
                    {
                        /*case 1: // Message
                            sendMessage(c.sentAt, c.author, c.content);
                            break;*/
                        
                        case 2: // Server info
                            servInfo[c.id] = {
                                name: c.name,
                                channels: {}
                            };
                            for (const chan of c.channels)
                            {
                                servInfo[c.id].channels[chan.id] = {
                                    name: chan.name,
                                    messages: chan.messages
                                }
                            }
                            if (currChan === null) {
                                currChan = {
                                    servId: c.id,
                                    chanId: c.channels[0].id
                                }
                                refreshMessageDisplay();
                            }

                            break;

                        case 3: // User info
                            userInfo[c.id] = c.username;
                            if (c.isMe) {
                                myUsername = c.username;
                            }
            
                            for (const msg of document.querySelectorAll(".message")) {
                                const usernameContainer = msg.querySelector(".subtitle");
                                const username = userInfo[usernameContainer.innerHTML];
                                if (username) {
                                    usernameContainer.innerHTML = username;
                                }
                            }
                            break;
                        
                    }
                }
                break;

            case 1: // Message received
                const username = userInfo[json.author];
                sendMessage(json.sentAt, username, json.content);
                if (!await notification.isFocusedAsync()) {
                    new window.Notification(username, {
                        body: json.content
                    });
                }
                break;

            case 2: // Acknowledgement of a message sent
                document.querySelector(`.message-${json.id}`).classList.remove("sending");
                if (json.isError) document.querySelector(`.message-${json.id}`).classList.add("error");
                break;
        }
    });
}