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
    sendMessageInternal(new Date(), "Me", text, [ "sending", `message-${id}` ]);
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

    container.appendChild(instance);

    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById("messages");
    container.scrollTo(0, container.scrollHeight);
}

let token = null;

// Deploy: "wss://amiko.zirk.eu/ws"
const apiTarget = "localhost:5129";
const isSecure = false;

function createWebsocketUrl() {
    return `ws${isSecure ? 's' : ''}://${apiTarget}/ws`
}
function createHttpUrl(endpoint) {
    return `http${isSecure ? 's' : ''}://${apiTarget}/api/${endpoint}`
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById("password-submit").addEventListener("click", _ => {
        const pwd = document.getElementById("password");

        fetch(createHttpUrl("auth/token"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pwd.value)
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(text => {
            token = text;
            pwd.value = "";
            document.getElementById("login-popup").classList.remove("is-active");
            openMessageConnection();
        })
        .catch((err) => {
            alert(`Login failed: ${err}`)
        });
    });
});

function openMessageConnection() {

    let currId = 0;

    sendSystemMessage(`Chrome v${versions.chrome()}, Node v${versions.node()}, Electron v${versions.electron()}`);

    const socket = new WebSocket(createWebsocketUrl(), ["client", token]);

    // Connection opened
    socket.addEventListener("open", (_) => {
        sendSystemMessage("Connected to server");
    });

    // Listen for messages
    socket.addEventListener("message", async function(event) {

        const json = JSON.parse(event.data);

        console.log(`Received ${json.type}`);
        switch (json.type) {
            case 0: // Message received
                sendMessage(json.sentAt, json.author, json.content);
                new window.Notification(json.author, {
                    body: json.content
                });
                break;

            case 1: // Array of messages received (app start)
                for (const c of json.data) {
                    sendMessage(c.sentAt, c.author, c.content);
                }
                break;

            case 2: // Acknowledgement of a message sent
                document.querySelector(`.message-${json.id}`).classList.remove("sending");
                if (json.isError) document.querySelector(`.message-${json.id}`).classList.add("error");
                break;

            case 3: // Users info
                for (const c of json.data) {
                    console.log(c);
                }

                document.getElementById("send-message").disabled = false;
                break;
        }
    });

    document.getElementById("send-message").addEventListener("click", _ => {
        const content = document.getElementById("message-field");
        if (content.value) {
            var newMsg = {
                type: 0,
                content: content.value,
                currId: currId
            };
            socket.send(JSON.stringify(newMsg));
            sendMyMessage(content.value, currId);
            currId++;
            content.value = "";
        }
    });
}