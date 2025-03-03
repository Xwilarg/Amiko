export class MessageManager {
    constructor(url, isSecure, setMessages) {
        this.apiTarget = url;
        this.isSecure = isSecure;
        this.token = null;
        this.myUsername = "";
        this.userInfo = null;
        this.currId = 0;

        this.socket = null;

        this.messages = [];
        this.setMessages = setMessages;
    }
    
    sendUserMessage(msg) {
        if (msg) {
            var newMsg = {
                type: 0,
                content: msg,
                id: this.currId
            };
            this.socket.send(JSON.stringify(newMsg));
            this.sendMyMessage(msg, this.currId);
            this.currId++;
        }
    }

    sendMessageInternal(msg) {
        this.messages.push(msg);
        this.setMessages([...this.messages]);
    }

    sendSystemMessage(text) {
        this.sendMessageInternal(new MessageCmp(new Date(), null, text, crypto.randomUUID()));
    }

    sendErrorMessage(text) {
        this.sendMessageInternal(new MessageCmp(new Date(), null, text, crypto.randomUUID()));
    }

    sendUserMessage(date, name, text) {
        this.sendMessageInternal(new MessageCmp(new Date(date.seconds * 1000 + date.nanos / 1e6), name, text, crypto.randomUUID()));
    }

    sendMyMessage(text, id) {
        this.sendMessageInternal(new MessageCmp(new Date(), myUsername, text, crypto.randomUUID()));
    }

    submitPassword(pwd) {
        fetch(this.createHttpUrl("auth/token"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pwd)
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(async text => {
            this.token = text;
            //await RNFS.writeFile(RNFS.DocumentDirectoryPath + '/token.dat', token, 'utf8');
            //await filesystem.writeAsync(token);
            this.openMessageConnection();
        })
        .catch((err) => {
            alert(`Login failed: ${err}`)
        });
    }

    openMessageConnection() {
        const self = this;

        //document.getElementById("send-message").disabled = true;
        //document.getElementById("messages").innerHTML = "";
        self.sendSystemMessage(`Connecting...`);

        self.socket = new WebSocket(self.createWebsocketUrl(), ["client", self.token]);

        // Connection opened
        self.socket.addEventListener("open", (_) => {
            self.sendSystemMessage("Connected to server");
        });

        self.socket.addEventListener("close", (_) => {
            self.openMessageConnection();
        });

        self.socket.addEventListener("error", (e) => {
            console.log(e);
        });

        // Listen for messages
        self.socket.addEventListener("message", async function(event) {

            const json = JSON.parse(event.data);

            console.log(`Received ${json.type}`);
            switch (json.type) {
                case 0: // Message received
                    const username = self.userInfo[json.author];
                    self.sendUserMessage(json.sentAt, username, json.content);
                    /*if (!await notification.isFocusedAsync()) {
                        new window.Notification(username, {
                            body: json.content
                        });
                    }*/
                    break;

                case 1: // Array of messages received (app start)
                    for (const c of json.data) {
                        self.sendUserMessage(c.sentAt, c.author, c.content);
                    }
                    break;

                case 2: // Acknowledgement of a message sent
                    //document.querySelector(`.message-${json.id}`).classList.remove("sending");
                    //if (json.isError) document.querySelector(`.message-${json.id}`).classList.add("error");
                    break;

                case 3: // Users info
                    self.userInfo = {};
                    for (const c of json.data) {
                        self.userInfo[c.id] = c.username;
                        if (c.isMe) {
                            self.myUsername = c.username;
                        }
                    }

                    for (const msg of document.querySelectorAll(".message")) {
                        const usernameContainer = msg.querySelector(".subtitle");
                        const username = self.userInfo[usernameContainer.innerHTML];
                        if (username) {
                            usernameContainer.innerHTML = username;
                        }
                    }

                    //document.getElementById("send-message").disabled = false;
                    break;
            }
        });
    }

    createWebsocketUrl() {
        return `ws${this.isSecure ? 's' : ''}://${this.apiTarget}/ws`
    }
    createHttpUrl(endpoint) {
        return `http${this.isSecure ? 's' : ''}://${this.apiTarget}/api/${endpoint}`
    }
}

class MessageCmp {
    constructor(date, name, message, id) {
        this.date = date;
        this.name = name;
        this.message = message;
        this.id = id;
    }
}