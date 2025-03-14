function sendSystemMessage(text) {
    sendMessageInternal(new Date(), null, text, [ "system" ]);
}

function sendErrorMessage(text) {
    sendMessageInternal(new Date(), null, text, [ "error" ]);
}

function sendMessage(date, name, text) {
    sendMessageInternal(new Date(date.seconds * 1000 + date.nanos / 1e6), name, text, []);
}

function sendMyMessage(text, id) {
    sendMessageInternal(new Date(), myUsername, text, [ "sending", `message-${id}` ]);
}

function sendMessageInternal(date, name, text, indications) {
    const container = document.getElementById("messages");
    const template = document.getElementById("message-template");

    const instance = template.content.cloneNode(true);
    instance.querySelector(".date").innerHTML = date.toLocaleString();
    instance.querySelector(".content").innerHTML = text;
    instance.querySelector(".subtitle").innerHTML = name;

    for (let i of indications) {
        instance.querySelector(".message").classList.add(i);
    }

    parseMessage(instance);

    container.appendChild(instance);

    scrollToBottom();
}

function parseMessage(msg) {
    const text = msg.querySelector(".content").innerHTML;

    let m = text.match(/https?:\/\/([^. \n]+\.)+(png|jpg|jpeg|gif)/gm);
    if (m) {
        const prev = msg.querySelector(".rich-preview");
        prev.classList.remove("is-hidden");
        for (let img of m) {
            prev.innerHTML += `<img class="image" src="${img}"/>`;
        }
    }

    msg.querySelector(".content").innerHTML = text.replaceAll(/(https?:\/\/([^ \n]+))/gm, '<span class="link">$1</span>');
    for (const link of msg.querySelectorAll(".link")) {
        link.addEventListener("click", (_) => {
            interaction.open(link.innerHTML);
        });
    }
}

function scrollToBottom() {
    const container = document.getElementById("messages");
    container.scrollTo(0, container.scrollHeight);
}

// Access token to the backend
let token = null;

// Current user username
let myUsername = "";

// All infos about various users
let userInfo = {};

// Current message ID
let currId = 0;

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

window.addEventListener('DOMContentLoaded', async () => {
    const pwd = document.getElementById("password");
    const fileToken = await filesystem.readAsync();

    if (fileToken) {
        fetch(createHttpUrl("auth/validate"), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${fileToken}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(_ => {
            token = fileToken;
            pwd.value = "";
            document.getElementById("login-popup").classList.remove("is-active");
            openMessageConnection();
        })
        .catch((err) => {});
    }

    document.getElementById("password-submit").addEventListener("click", _ => {

        fetch(createHttpUrl("auth/token"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pwd.value)
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(async text => {
            token = text;
            await filesystem.writeAsync(token);
            pwd.value = "";
            document.getElementById("login-popup").classList.remove("is-active");
            openMessageConnection();
        })
        .catch((err) => {
            alert(`Login failed: ${err}`)
        });
    });

    document.getElementById("send-message").addEventListener("click", e => {
        e.preventDefault();
        const content = document.getElementById("message-field");
        if (content.value) {
            var newMsg = {
                type: 0,
                content: content.value,
                id: currId
            };
            socket.send(JSON.stringify(newMsg));
            sendMyMessage(content.value, currId);
            currId++;
            content.value = "";
        }
    });
});

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
                        case 1: // Message
                            sendMessage(c.sentAt, c.author, c.content);
                            break;
                        
                        case 2: // Server info
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