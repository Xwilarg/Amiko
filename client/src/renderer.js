import { closeSettings } from ".";
import { downloadChanExport, sendMessageFromInput, sendSeenUpdate } from "./network";
import { addNotificationDiv, addPendingNotification } from "./notification";
import { getCurrentAltUser } from "./preferences";
import { getInfoFromId, resetUsers, updateProfileDisplayAsync, userIdListToInfo } from "./user";
var EmojiConvertor = require('emoji-js');

export function sendSystemMessage(text) {
    sendMessageInternal(new Date(), [], text, [ "system" ]);
}

export function sendErrorMessage(text) {
    sendMessageInternal(new Date(), [], text, [ "error" ]);
}

function sendIncomingMessage(date, ids, text) {
    sendMessageInternal(new Date(date * 1000), ids.map(getInfoFromId), text, []);
}

export function sendMyMessage(msg, text, id) {
    const now = new Date();
    msg.date = now;
    msg.authors = getCurrentAltUser();
    servInfo[currChan.servId].channels[currChan.chanId].messages.push(msg);
    sendMessageInternal(now, userIdListToInfo(getCurrentAltUser()), text, [ "sending", `message-${id}` ]);
}

function updateMessageAuthor(message, infos) {
    message.querySelector(".subtitle").innerHTML = infos.map(x => x.username).join(" / ");
    var pfp = message.querySelector(".pfp");
    const r = infos.map(x => x.color.r).reduce((a, b) => a + b, 0) / infos.length;
    const g = infos.map(x => x.color.g).reduce((a, b) => a + b, 0) / infos.length;
    const b = infos.map(x => x.color.b).reduce((a, b) => a + b, 0) / infos.length;
    pfp.style = `background: rgb(${r}, ${g}, ${b});`;
    if (infos.length === 1) {
        pfp.innerHTML = infos[0].character;
    } else {
        let arr = [];
        const characters = infos.map(x => x.character).sort((a, b) => b.length - a.length);
        for (let i in characters[0])
        {
            arr.push(characters[0].codePointAt(i));
        }
        for (const c of characters.slice(1))
        {
            for (let i in c)
            {
                arr[i] += c.codePointAt(i);
            }
        }
        for (let i in arr)
        {
            arr[i] = Math.floor(arr[i] / infos.length);
        }
        pfp.innerHTML = String.fromCodePoint(...arr);
    }
}

function sendMessageInternal(date, infos, text, indications) {
    const container = document.getElementById("messages");
    const template = document.getElementById("message-template");

    const instance = template.content.cloneNode(true);
    updateMessageAuthor(instance, infos)
    instance.querySelector(".date").innerHTML = date.toLocaleString();


    for (let i of indications) {
        instance.querySelector(".message").classList.add(i);
    }

    parseMessage(instance, text);

    container.appendChild(instance);

    scrollToBottom();
}

function getMarkdown(html) {
    html = html.replaceAll(/```\n?(([^`]+`{0,2})*)```/gm, '<pre>$1</pre>');
    html = html.replaceAll(/`([^*]+)`/gm, '<code>$1</code>');
    html = html.replaceAll(/^&gt; ([^\n]+)/gm, '<pre>$1</pre>');
    html = html.replaceAll(/\*\*(([^*]+\*{0,1})*)\*\*/gm, '<b>$1</b>');
    html = html.replaceAll(/\*([^*]+)\*/gm, '<i>$1</i>');
    return html;
}

function parseMessage(msg, text) {
    msg.querySelector(".rich-preview").innerHTML = "";
    let finalHtml = text.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

    // Pattern match urls
    // Optionally at the start we can have <XXX:
    // <> specify special formats (by default hide image)
    // XXX: overrides behaviors

    // Regex explanations:
    // First look for "<" (optional)
    // Then look for behavior specification "XXXXX:" (optional)
    // Then we look for the URL, it matches until it find one of the following strings: '^', ' ', '\n', ')', ',', ';', '>', '[end of line]'
    // We check if we have a ">" at the end (optional)
    let link = finalHtml.matchAll(/((&lt;)(([a-zA-Z]+):)?)?(https?:\/\/.+?)(^| |\n|\)|,|;|&gt;|$)(&gt;)?/gm);
    if (link) {
        const prev = msg.querySelector(".rich-preview");
        let behavior = "";

        for (let l of link) {
            if (l[2] === "&lt;" && l[6] === "&gt;")
            {
                switch (l[4])
                {
                    case "b":
                        behavior = "blur";
                        break;

                    default: // Don't show the image
                        continue;
                }
            }

            let m = l[5].match(/(png|jpg|jpeg|gif|webp)$/m);
            if (m && !l[5].includes('"')) { // Ensure we can't inject code by closing the string
                prev.classList.remove("is-hidden");
                prev.innerHTML += `<div class="preview"><img class="image ${behavior}" src="${l[5]}"/></div>`;
            }
            
            // Youtube check
            let yt = l[5].match(/youtube\.com\/watch\?v=([0-9a-zA-Z_]+)/m);
            if (yt) {
                prev.classList.remove("is-hidden");
                if (behavior === "") {
                    prev.innerHTML += `<div class="preview"><iframe type="text/html" width="256" height="256" src="https://www.youtube-nocookie.com/embed/${yt[1]}" frameborder="0"></iframe></div>`;
                } else {
                    prev.innerHTML += `<div class="preview"><img data-yt="${yt[1]}" class="image ${behavior}" src="https://img.youtube.com/vi/${yt[1]}/0.jpg"/></div>`;
                }
            }
        }

        // When we click on something that have a blur effect, we remove it
        for (let p of prev.getElementsByClassName("preview")) {
            p.addEventListener("click", e => {
                e.target.classList.remove("blur");

                if (e.target.dataset.yt) {
                    e.target.parentNode.innerHTML = `<iframe type="text/html" width="256" height="256" src="https://www.youtube-nocookie.com/embed/${e.target.dataset.yt}" frameborder="0"></iframe>`;
                }
            });
        }
    }

    finalHtml = finalHtml.replaceAll(/(https?:\/\/.+?)(^| |\n|\)|,|;|&gt;|$)/gm, '<span class="link">$1</span>$2');

    finalHtml = emoji.replace_colons(finalHtml);

    finalHtml = getMarkdown(finalHtml);
    finalHtml = finalHtml.replaceAll("\n", "<br>");

    msg.querySelector(".content").innerHTML = finalHtml;

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
    const chanName = servInfo[currChan.servId].channels[currChan.chanId].name;

    // Update export button to work with current channel
    // TODO: Don't do that everytimes
    document.getElementById("channel-title").innerHTML = chanName;
    document.getElementById("export-button").disabled = false;
    document.getElementById("export-button").onclick = () => {
        downloadChanExport(chanName, currChan.servId, currChan.chanId);
    };

    // Update all messages
    const container = document.getElementById("messages");
    container.innerHTML = "";
    for (const msg of servInfo[currChan.servId].channels[currChan.chanId].messages) {
        let date;
        if (msg.sentAt) {
            date = new Date(msg.sentAt * 1000)
        } else {
            date = msg.date;
        }
        sendMessageInternal(date, msg.authors.map(getInfoFromId), msg.content, []);
    }

    // Whole message list are updated when we display a new channel or so
    // Hense we send a "seen" notification
    sendSeenUpdate(currChan.servId, currChan.chanId);
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

        addNotificationDiv(chanBtn, `notif-channel-${currChan.servId}-${key}`);

        document.getElementById("channels").appendChild(chanBtn);
    }
}

const emoji = new EmojiConvertor();
emoji.replace_mode = "unified";

// All infos about various users
let servInfo = {};
let currChan = null;

export function isCurrentChannel(servId, chanId)
{
    return servId === currChan.servId && chanId === currChan.chanId;
}

export function updateReceivedMessage(msg) {
    servInfo[msg.serverId].channels[msg.channelId].messages.push(msg);
    if (currChan.servId === msg.serverId && currChan.chanId === msg.channelId) {
        sendIncomingMessage(msg.sentAt, msg.authors, msg.content);
    }
}

export function resetInfo()
{
    resetUsers();
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

        if (currChan === null) { // No channel set yet, we take the first coming by
            currChan = {
                servId: msg.id,
                chanId: msg.channels[0].id
            }
            console.log(`Automatically load channel ${currChan.servId} / ${currChan.chanId}`);
            document.getElementById("send-message").disabled = false;
            refreshMessageDisplay();
        }
    }

    // Spawn buttons for server selection
    const servBtn = document.createElement("button");
    servBtn.innerHTML = msg.name;
    servBtn.classList.add("button");
    if (currChan.servId == msg.id) servBtn.classList.add("is-primary");

    servBtn.addEventListener("click", (e) => { // We clicked on a button to switch server...
        currChan = {
            servId: msg.id,
            chanId: msg.channels[0].id // Current channel become the first we find
        }

        // Refresh channels and messages to display the ones of the new server/channel
        refreshChannelDisplay();
        refreshMessageDisplay();

        // Update server display UI
        document.querySelector("#servers > .is-primary").classList.remove("is-primary");
        e.target.classList.add("is-primary");
    });

    addNotificationDiv(servBtn, `notif-server-${msg.id}`);

    document.getElementById("servers").appendChild(servBtn);

    // Check if we have any unread message
    for (const chan of msg.channels)
    {
        // Update notifications
        if (chan.messages.length > 0 && chan.lastSeen < chan.messages[chan.messages.length - 1].sentAt)
        {
            addPendingNotification(msg.id, chan.id);
            console.log(`New message available in ${msg.name}/${chan.name}`)
        }
    }
}

export function acknowledgeMessage(msg) {
    const message = document.querySelector(`.message-${msg.id}`);

    message.classList.remove("sending");
    if (msg.isError) message.classList.add("error");

    if (msg.authors) {
        updateMessageAuthor(message, msg.authors.map(getInfoFromId))
    }
    if (msg.content) {
        parseMessage(message, msg.content);
    }
}

// Once we received info about channels and users, we show everything properly
export async function finishSetupAsync()
{
    refreshChannelDisplay();
    refreshMessageDisplay();
    await updateProfileDisplayAsync();
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

    for (const spMd of document.getElementsByClassName("apply-markdown"))
    {
        spMd.innerHTML = getMarkdown(spMd.innerHTML);
    }
}

