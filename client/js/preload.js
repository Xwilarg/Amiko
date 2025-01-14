const protobuf = require("protobufjs");

function sendMessage(text) {
    const container = document.getElementById("messages");
    const template = document.getElementById("message");

    const instance = template.content.cloneNode(true);
    const content = instance.querySelector(".content");
    content.innerHTML = text;

    container.appendChild(instance);
}

window.addEventListener('DOMContentLoaded', () => {

    sendMessage(`Chrome v${process.versions["chrome"]}, Node v${process.versions["node"]}, Electron v${process.versions["electron"]}`);

    protobuf.load("message.proto", function(err, root) {
        if (err) {
            sendMessage(err.message);
            return;
        }
        var msg = root.lookupType("Message");

        const socket = new WebSocket("ws://localhost:5129/ws"); // ws://amiko.zirk.eu/ws

        // Connection opened
        socket.addEventListener("open", (event) => {
            sendMessage("Connected to server");
        });

        // Listen for messages
        socket.addEventListener("message", async function(event) {
            const buffer = await new Response(event.data).arrayBuffer();
            const uint = [...new Uint8Array(buffer)];
            sendMessage(msg.decode(uint).content);
        });
    });
});