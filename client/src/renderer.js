import { closeSettings } from ".";
import { downloadChanExport, sendMessageFromInput, switchProfile } from "./network";

export function sendSystemMessage(text) {
    sendMessageInternal(new Date(), null, text, [ "system" ]);
}

export function sendErrorMessage(text) {
    sendMessageInternal(new Date(), null, text, [ "error" ]);
}

export function getUsernameFromId(id) {
    if (id in userInfo) {
        return userInfo[id];
    }
    return id;
}

function sendIncomingMessage(date, id, text) {
    sendMessageInternal(new Date(date.seconds * 1000 + date.nanos / 1e6), getUsernameFromId(id), text, []);
}

export function sendMyMessage(msg, text, id) {
    const now = new Date();
    msg.date = now;
    servInfo[currChan.servId].channels[currChan.chanId].messages.push(msg);
    sendMessageInternal(now, myUsername, text, [ "sending", `message-${id}` ]);
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
    const content = msg.querySelector(".content");
    let finalHtml = content.innerHTML.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

    let m = finalHtml.match(/https?:\/\/([^. \n]+\.)+(png|jpg|jpeg|gif)([^ \n]+)?/gm);
    if (m) {
        const prev = msg.querySelector(".rich-preview");
        prev.classList.remove("is-hidden");
        for (let img of m) {
            prev.innerHTML += `<img class="image" src="${img}"/>`;
        }
    }

    finalHtml = finalHtml.replaceAll(/(https?:\/\/([^ \n]+))/gm, '<span class="link">$1</span>');
    for (const link of msg.querySelectorAll(".link")) {
        link.addEventListener("click", (_) => {
            interaction.open(link.innerHTML);
        });
    }

    finalHtml = finalHtml.replaceAll(/```\n?(([^`]+`{0,2})*)```/gm, '<pre>$1</pre>');
    finalHtml = finalHtml.replaceAll(/^&gt; ([^\n]+)/gm, '<pre>$1</pre>');
    finalHtml = finalHtml.replaceAll(/\*\*(([^*]+\*{0,1})*)\*\*/gm, '<b>$1</b>');
    finalHtml = finalHtml.replaceAll(/\*([^*]+)\*/gm, '<i>$1</i>');
    finalHtml = finalHtml.replaceAll("\n", "<br>");

    content.innerHTML = finalHtml;
}

function scrollToBottom() {
    const container = document.getElementById("messages");
    container.scrollTo(0, container.scrollHeight);
}

function refreshMessageDisplay() {
    const chanName = servInfo[currChan.servId].channels[currChan.chanId].name;
    document.getElementById("channel-title").innerHTML = chanName;
    document.getElementById("export-button").disabled = false;
    document.getElementById("export-button").onclick = () => {
        downloadChanExport(chanName, currChan.servId, currChan.chanId);
    };

    const container = document.getElementById("messages");
    container.innerHTML = "";
    for (const msg of servInfo[currChan.servId].channels[currChan.chanId].messages) {
        let date;
        if (msg.sentAt) {
            date = new Date(msg.sentAt.seconds * 1000 + msg.sentAt.nanos / 1e6)
        } else {
            date = msg.date;
        }
        sendMessageInternal(date, msg.author ? getUsernameFromId(msg.author) : myUsername, msg.content, []);
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
            currChan.chanId = parseInt(key);
            refreshMessageDisplay();
            document.querySelector("#channels > .is-primary").classList.remove("is-primary");
            e.target.classList.add("is-primary");

            closeSettings();
        });
        document.getElementById("channels").appendChild(chanBtn);
    }
}

// Current user username
let myUsername = "";
let myId = null;

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

export function resetInfo()
{
    userInfo = {};
    servInfo = {};
    currChan = null;
    document.getElementById("export-button").disabled = true;
    document.getElementById("send-message").disabled = true;
    document.getElementById("servers").innerHTML = "";
    document.getElementById("channels").innerHTML = "";
    document.getElementById("profile-selection").innerHTML = "";
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
            console.log(`Automatically load channel ${currChan.servId} / ${currChan.chanId}`);
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
    if (myId == null && msg.isMe) {
        myUsername = msg.username;
        myId = msg.id;
    } else if (myId !== null && myId === msg.id) {
        myUsername = msg.username;
    }

    if (msg.isMyGroup || msg.isMe) {
        const persoBtn = document.createElement("button");
        persoBtn.innerHTML = msg.username;
        persoBtn.classList.add("button");
        persoBtn.classList.add("profile")
        if (myId === msg.id) persoBtn.disabled = true;

        persoBtn.addEventListener("click", (e) => {
            switchProfile(msg.id, () => {
                myUsername = msg.username;

                document.querySelector(".profile:disabled").disabled = false;
                e.target.disabled = true;
            });
        });
        document.getElementById("profile-selection").appendChild(persoBtn);
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
    document.getElementById("message-field").addEventListener("keypress", (e) => {
        if (e.key == 'Enter' && !e.shiftKey) {
            document.getElementById("send-message").click();
            e.preventDefault();
        }
    });
}

