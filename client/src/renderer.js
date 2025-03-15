import { sendMessageFromInput } from "./network";

export function sendSystemMessage(text) {
    sendMessageInternal(new Date(), null, text, [ "system" ]);
}

export function sendErrorMessage(text) {
    sendMessageInternal(new Date(), null, text, [ "error" ]);
}

function sendIncomingMessage(date, id, text) {
    let name;
    if (id in userInfo) {
        name = userInfo[id];
    } else {
        name = id;
    }
    sendMessageInternal(new Date(date.seconds * 1000 + date.nanos / 1e6), name, text, []);
}

export function sendMyMessage(text, id) {
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
    for (const msg of servInfo[currChan.servId].channels[currChan.chanId].messages) {
        sendIncomingMessage(msg.sentAt, msg.author, msg.content);
    }
}

function refreshChannelDisplay() {
    const channels = document.getElementById("channels");
    channels.innerHTML = "";
    for (const [key, value] of Object.entries(servInfo[currChan.servId].channels)) {
        const chanBtn = document.createElement("button");
        chanBtn.innerHTML = value.name;
        chanBtn.classList.add("button");
        if (currChan.chanId == key) chanBtn.classList.add("is-primary");

        chanBtn.addEventListener("click", (e) => {
            currChan.chanId = key;
            refreshMessageDisplay();
            document.querySelector("#channels > .is-primary").classList.remove("is-primary");
            e.target.classList.add("is-primary");
        });
        document.getElementById("channels").appendChild(chanBtn);
    }
}

// Current user username
let myUsername = "";

// All infos about various users
let userInfo = {};
let servInfo = {};
let currChan = null;

export function updateReceivedMessage(msg) {
    servInfo[msg.serverId].channels[msg.channelId].messages.push(msg);
    if (currChan.servId === msg.serverId && currChan.chanId === msg.channelId) {
        sendIncomingMessage(msg.sentAt, msg.author, msg.content);
    }
}

export function updateServerInfo(msg) {
    servInfo[msg.id] = {
        name: msg.name,
        channels: {}
    };
    for (const chan of msg.channels)
    {
        servInfo[msg.id].channels[chan.id] = {
            name: chan.name,
            messages: chan.messages
        }

        if (currChan === null) {
            currChan = {
                servId: msg.id,
                chanId: msg.channels[0].id
            }
            console.log(`Current channel is now ${currChan.servId} / ${currChan.chanId}`);
            document.getElementById("send-message").disabled = false;
            refreshMessageDisplay();
        }
    }
    refreshChannelDisplay(); // TODO: don't call that everytimes

    const servBtn = document.createElement("button");
    servBtn.innerHTML = msg.name;
    servBtn.classList.add("button");
    if (currChan.servId == msg.id) servBtn.classList.add("is-primary");

    servBtn.addEventListener("click", (e) => {
        currChan = {
            servId: msg.id,
            chanId: msg.channels[0].id
        }
        refreshChannelDisplay();
        refreshMessageDisplay();
        document.querySelector("#servers > .is-primary").classList.remove("is-primary");
        e.target.classList.add("is-primary");
    });
    document.getElementById("servers").appendChild(servBtn);
}

export function updateUserInfo(msg) {
    userInfo[msg.id] = msg.username;
    if (msg.isMe) {
        myUsername = msg.username;
    }

    for (const m of document.querySelectorAll(".message")) {
        const usernameContainer = m.querySelector(".subtitle");
        const username = userInfo[usernameContainer.innerHTML];
        if (username) {
            usernameContainer.innerHTML = username;
        }
    }
}

export function initRenderer()
{
    document.getElementById("send-message").addEventListener("click", e => {
        e.preventDefault();
        const content = document.getElementById("message-field");
        if (content.value) {
            sendMessageFromInput(content.value, currChan.servId, currChan.chanId);
            content.value = "";
        }
    });
}

