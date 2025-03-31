import { addAttachment } from "./attachment";
import { addPendingNotification, removeNotification } from "./notification";
import { getCurrentAltUser, getNotificationPrivacySettings, getNotificationSettings, NOTIF_MODE_SHOW_ALL, NOTIF_SELECTION_ALL, NOTIF_SELECTION_NONE } from "./preferences";
import { acknowledgeMessage, finishSetupAsync, isCurrentChannel, resetInfo, sendErrorMessage, sendMyMessage, sendSystemMessage, updateReceivedMessage, updateServerInfo } from "./renderer";
import { getInfoFromId, getPossibleUsers, updateUserInfo, userIdListToInfo, wasIMentionned } from "./user";

const apiTarget = "amiko.zirk.eu";
const isSecure = true;
/*
const apiTarget = "localhost:5129";
const isSecure = false;
*/

let socket;
let networkInterval = null;

let sessionToken;

// Current message ID
let currId = 1;

// Store when the last notification was received
// Used when notification settings is set on all messages, to not spam the user
let lastNotificationReceived = null;

function createWebsocketUrl() {
    return `ws${isSecure ? 's' : ''}://${apiTarget}/ws`
}
export function createHttpUrl(endpoint) {
    return `http${isSecure ? 's' : ''}://${apiTarget}/api/${endpoint}`
}

export function sendMessageFromInput(content, servId, chanId, attachedFiles) {
    var newMsg = {
        type: 2,
        content: content,
        ackId: currId,
        serverId: servId,
        channelId: chanId,
        authors: getCurrentAltUser()
    };
    socket.send(JSON.stringify(newMsg));
    sendMyMessage(newMsg, content, currId);
    if (attachedFiles.length > 0) {
        addAttachment(currId, attachedFiles);
    }
    currId++;
}

export function sendSeenUpdate(servId, chanId) {
    socket.send(JSON.stringify({
        type: 6,
        serverId: servId,
        channelId: chanId,
    }));
    removeNotification(servId, chanId); // We saw the message so we discard related notifications
}

export function sendAttachmentOverNetwork(msgId, files) {
    const data = new FormData();
    console.log(files);
    for (const f of files) {
        data.append("files", f);
    }

    fetch(createHttpUrl(`attachment/attach/${msgId}`), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${sessionToken}`
        },
        body: data
    })
    .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
    .then(text => {})
    .catch((err) => { sendErrorMessage("Attachment upload failed: " + err) });
}

export function downloadChanExport(chanName, servId, chanId) {
    fetch(createHttpUrl(`export/${servId}/${chanId}`), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${sessionToken}`
        }
    })
    .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
    .then(text => {
        var e = document.createElement('a');
        // https://stackoverflow.com/questions/65050679/javascript-a-simple-way-to-save-a-text-file/73775602#73775602
        e.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        e.setAttribute('download', `export-${chanName}.md`);
        e.style.display = 'none';
        document.body.appendChild(e);
        e.click();
        document.body.removeChild(e);
    })
    .catch((err) => { sendErrorMessage("Export failed: " + err) });
}

function sendNotification(json) {
    if (!compatibility.notification()) return;

    let shouldSend;

    const notifSettings = getNotificationSettings();

    // If user want no notification, we can just return
    if (notifSettings == NOTIF_SELECTION_NONE) shouldSend = false;
    if (notifSettings == NOTIF_SELECTION_ALL)
    {
        // Only ping once every 20s
        if (lastNotificationReceived === null ||
            new Date().getTime() - lastNotificationReceived > 20000)
        {
            lastNotificationReceived = new Date().getTime();
            shouldSend = true;
        }
        else
        {
            shouldSend = false;
        }
    }
    else shouldSend = wasIMentionned(json.content);

    if (shouldSend) {
        const notifPrivacy = getNotificationPrivacySettings();

        if (notifPrivacy == NOTIF_MODE_SHOW_ALL) {
            new window.Notification(`Message from  ${json.authors.map(x => getInfoFromId(x).username)}`, {
                body: json.content
            });
        }
        else
        {
            new window.Notification("New message received");
        }
    }
}

export function openMessageConnection(token) {
    sessionToken = token;
    document.getElementById("messages").innerHTML = "";

    // TODO: Move on refresh
    sendSystemMessage(`Chrome v${versions.chrome()}, Node v${versions.node()}, Electron v${versions.electron()}`);
    sendSystemMessage(`Connecting...`);

    socket = new WebSocket(createWebsocketUrl(), ["client", token]);

    // Connection opened
    socket.addEventListener("open", (_) => {
        sendSystemMessage("Connected to server");

        if (networkInterval !== null)
        {
            clearInterval(networkInterval);
        }
        networkInterval = setInterval(() => {
            socket.send(JSON.stringify({ type: 0 }));
        }, 10_000);
    });

    socket.addEventListener("close", (_) => {
        resetInfo();
        sendErrorMessage("Connection closed");
        openMessageConnection(token);
    });

    socket.addEventListener("error", (e) => {
        sendErrorMessage("Websocket error");
    });

    // Listen for messages
    socket.addEventListener("message", async function(event) {
        const json = JSON.parse(event.data);

        switch (json.type) {
            case 0: // Ack
                break;

            case 1: // Data received is an array
                for (const c of json.data) {
                    switch (c.type)
                    {
                        /*case 2: // Message
                            sendMessage(c.sentAt, c.author, c.content);
                            break;*/
                        
                        case 4: // Server info
                            updateServerInfo(c);
                            break;

                        case 5: // User info
                            updateUserInfo(c);
                            break;
                        
                    }
                }
                await finishSetupAsync(); // TODO: Doesn't call it from here
                break;

            case 2: // Message received
                updateReceivedMessage(json);
                if (isCurrentChannel(json.serverId, json.channelId))
                {
                    sendSeenUpdate(json.serverId, json.channelId);
                    if (!await notification.isFocusedAsync()) { // We are in the current channel but window isn't focused, we send a notification
                        sendNotification(json);
                    }
                }
                else { // Whenever we are currently looking at the window or not, the message have lend in another channel so we send a notification
                    addPendingNotification(json.serverId, json.channelId);
                    sendNotification(json);
                }
                break;

            case 3: // Acknowledgement of a message sent
                acknowledgeMessage(json);
                break;
        }
    });
}