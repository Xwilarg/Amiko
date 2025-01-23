const os = require('os');

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
    sendMessageInternal(new Date(), os.hostname(), text, [ "sending", `message-${id}` ]);
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

window.addEventListener('DOMContentLoaded', () => {

    let currId = 0;

    sendSystemMessage(`Chrome v${process.versions["chrome"]}, Node v${process.versions["node"]}, Electron v${process.versions["electron"]}`);

    const socket = new WebSocket("ws://localhost:5129/ws");
    // const socket = new WebSocket("ws://amiko.zirk.eu/ws");

    // Connection opened
    socket.addEventListener("open", (_) => {
        sendSystemMessage("Connected to server");
    });

    // Listen for messages
    socket.addEventListener("message", async function(event) {

        const json = JSON.parse(event.data);

        console.log(`Received ${json.type}`);
        switch (json.type) {
            case 0:
                sendMessage(json.sentAt, json.name, json.content);
                break;

            case 1:
                for (const c of json.messages) {
                    sendMessage(c.sentAt, c.name, c.content);
                }
                break;
                
            case 2:
                document.querySelector(`.message-${json.id}`).classList.remove("sending");
                if (json.isError) document.querySelector(`.message-${json.id}`).classList.add("error");
                break;
        }
    });

    document.getElementById("send-message").addEventListener("click", _ => {
        const content = document.getElementById("message-field");
        if (content.value) {
            var newMsg = {
                type: 0,
                name: os.hostname(),
                content: content.value,
                currId: currId
            };
            socket.send(JSON.stringify(newMsg));
            sendMyMessage(content.value, currId);
            currId++;
            content.value = "";
        }
    });
});