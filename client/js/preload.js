const protobuf = require("protobufjs");

function sendSystemMessage(text) {
    sendMessageInternal(new Date(), null, text, "system");
}

function sendErrorMessage(text) {
    sendMessageInternal(new Date(), null, text, "error");
}

function sendMessage(date, name, text) {
    sendMessageInternal(new Date(date.seconds.toNumber() * 1000 + date.nanos / 1e6), name, text, null);
}

function sendMessageInternal(date, name, text, indication) {
    const container = document.getElementById("messages");
    const template = document.getElementById("message-template");

    const instance = template.content.cloneNode(true);
    instance.querySelector(".date").innerHTML = date.toLocaleString();
    instance.querySelector(".content").innerHTML = text;
    instance.querySelector(".subtitle").innerHTML = name;

    if (indication !== null) {
        instance.querySelector(".message").classList.add(indication);
    }

    container.appendChild(instance);
}

window.addEventListener('DOMContentLoaded', () => {

    sendSystemMessage(`Chrome v${process.versions["chrome"]}, Node v${process.versions["node"]}, Electron v${process.versions["electron"]}`);

    protobuf.load("message.proto", function(err, root) {
        if (err) {
            sendErrorMessage(err.message);
            return;
        }
        var msg = root.lookupType("MessageArray");

        const socket = new WebSocket("ws://localhost:5129/ws");
        // const socket = new WebSocket("ws://amiko.zirk.eu/ws");

        // Connection opened
        socket.addEventListener("open", (event) => {
            sendSystemMessage("Connected to server");
        });

        // Listen for messages
        socket.addEventListener("message", async function(event) {
            const buffer = await new Response(event.data).arrayBuffer();
            const uint = [...new Uint8Array(buffer)];
            for (const c of msg.decode(uint).messages) {
                sendMessage(c.sentAt, c.name, c.content);
            }
        });

        document.getElementById("send-message").addEventListener("click", _ => {
            const content = document.getElementById("message-field");
            if (content.value) {
                var message = AwesomeMessage.create({
                    type: 0,
                    name: "Test user",
                    content: message,
                    sent_at: 0
                });
                console.log(content.value);
                content.value = "";
            }
        });
    });
});