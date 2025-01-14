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

        const socket = new WebSocket("ws://localhost:5129/ws");
        // const socket = new WebSocket("ws://amiko.zirk.eu/ws");

        // Connection opened
        socket.addEventListener("open", (event) => {
            sendSystemMessage("Connected to server");
        });

        const type_id = root.lookupType("TargetType");
        const type_msgArr = root.lookupType("MessageArray");
        const type_msg = root.lookupType("Message");
        // Listen for messages
        socket.addEventListener("message", async function(event) {

            const buffer = await new Response(event.data).arrayBuffer();
            const uint = [...new Uint8Array(buffer)];

            console.log(type_id.decode(uint).type);
            switch (type_id.decode(uint).type) {
                case 0:
                    const c = type_msg.decode(uint);
                    sendMessage(c.sentAt, c.name, c.content);
                    break;

                case 1:
                    for (const c of type_msgArr.decode(uint).messages) {
                        sendMessage(c.sentAt, c.name, c.content);
                    }
                    break;
            }
        });

        document.getElementById("send-message").addEventListener("click", _ => {
            const content = document.getElementById("message-field");
            if (content.value) {
                var newMsg = type_msg.create({
                    type: 0,
                    name: "Test user",
                    content: content.value
                });
                socket.send(type_msg.encode(newMsg).finish());
                content.value = "";
            }
        });
    });
});