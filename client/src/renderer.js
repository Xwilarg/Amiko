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

function refreshMessageDisplay() {
    const container = document.getElementById("messages");
    container.innerHTML = "";
}

// Current user username
let myUsername = "";

// All infos about various users
let userInfo = {};
let servInfo = {};
let currChan = null;

// Current message ID
let currId = 0;

export function sendMessageFromInput(content) {
    var newMsg = {
        type: 0,
        content: content,
        id: currId
    };
    socket.send(JSON.stringify(newMsg));
    sendMyMessage(content, currId);
    currId++;
}

