import { PasswordModal } from "./components/PasswordModal";
import { Message } from "./components/Message"
import { FlatList, Text, View } from "react-native";
const RNFS = require('react-native-fs');

export default function App() {
    const [message, setMessage] = useState("");
    return (
        <View
        style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        }}
        >
            <PasswordModal callback={(pwd) => {submitPassword(pwd)}}></PasswordModal>

            <FlatList
                data={messages}
                renderItem={({item}) => <Message date={item.date.toLocaleString()} name={item.name} message={item.message} />}
                keyExtractor={item => item.id}
            >
                
            </FlatList>

            <View style={{}}>
                <TextInput style={styles.textInput} secureTextEntry={true} onChangeText={setMessage}></TextInput>
                <Button title='Submit' onPress={() => {
                    sendMessage(message);
                    setMessage("");
                }} />
            </View>
        </View>
    );
}


// Access token to the backend
let token = null;

// Current user username
let myUsername = "";

// All infos about various users
let userInfo;

// Current message ID
let currId = 0;

/*
const apiTarget = "amiko.zirk.eu";
const isSecure = true;
*/
const apiTarget = "localhost:5129";
const isSecure = false;

let messages = [];

class MessageCmp {
    constructor(date, name, message, id) {
        this.date = date;
        this.name = name;
        this.message = message;
        this.id = id;
    }
}

function sendMessage(msg) {
    if (msg) {
        var newMsg = {
            type: 0,
            content: content.value,
            id: currId
        };
        socket.send(JSON.stringify(newMsg));
        sendMyMessage(content.value, currId);
        currId++;
    }
}

function sendMessageInternal(msg) {
    messages.push(msg);
}

function sendSystemMessage(text) {
    sendMessageInternal(new MessageCmp(new Date(), null, text, crypto.randomUUID()));
}

function sendErrorMessage(text) {
    sendMessageInternal(new MessageCmp(new Date(), null, text, crypto.randomUUID()));
}

function sendMessage(date, name, text) {
    sendMessageInternal(new MessageCmp(new Date(date.seconds * 1000 + date.nanos / 1e6), name, text, crypto.randomUUID()));
}

function sendMyMessage(text, id) {
    sendMessageInternal(new MessageCmp(new Date(), myUsername, text, crypto.randomUUID()));
}

function submitPassword(pwd) {
    fetch(createHttpUrl("auth/token"), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pwd)
    })
    .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
    .then(async text => {
        token = text;
        //await RNFS.writeFile(RNFS.DocumentDirectoryPath + '/token.dat', token, 'utf8');
        //await filesystem.writeAsync(token);
        openMessageConnection();
    })
    .catch((err) => {
        alert(`Login failed: ${err}`)
    });
}

let socket;

function openMessageConnection() {
    //document.getElementById("send-message").disabled = true;
    //document.getElementById("messages").innerHTML = "";
    sendSystemMessage(`Connecting...`);

    socket = new WebSocket(createWebsocketUrl(), ["client", token]);

    // Connection opened
    socket.addEventListener("open", (_) => {
        sendSystemMessage("Connected to server");
    });

    socket.addEventListener("close", (_) => {
        openMessageConnection();
    });

    socket.addEventListener("error", (e) => {
        console.log(e);
    });

    // Listen for messages
    socket.addEventListener("message", async function(event) {

        const json = JSON.parse(event.data);

        console.log(`Received ${json.type}`);
        switch (json.type) {
            case 0: // Message received
                const username = userInfo[json.author];
                sendMessage(json.sentAt, username, json.content);
                /*if (!await notification.isFocusedAsync()) {
                    new window.Notification(username, {
                        body: json.content
                    });
                }*/
                break;

            case 1: // Array of messages received (app start)
                for (const c of json.data) {
                    sendMessage(c.sentAt, c.author, c.content);
                }
                break;

            case 2: // Acknowledgement of a message sent
                //document.querySelector(`.message-${json.id}`).classList.remove("sending");
                //if (json.isError) document.querySelector(`.message-${json.id}`).classList.add("error");
                break;

            case 3: // Users info

                userInfo = {};
                for (const c of json.data) {
                    userInfo[c.id] = c.username;
                    if (c.isMe) {
                        myUsername = c.username;
                    }
                }

                for (const msg of document.querySelectorAll(".message")) {
                    const usernameContainer = msg.querySelector(".subtitle");
                    const username = userInfo[usernameContainer.innerHTML];
                    if (username) {
                        usernameContainer.innerHTML = username;
                    }
                }

                //document.getElementById("send-message").disabled = false;
                break;
        }
    });
}

function createWebsocketUrl() {
    return `ws${isSecure ? 's' : ''}://${apiTarget}/ws`
}
function createHttpUrl(endpoint) {
    return `http${isSecure ? 's' : ''}://${apiTarget}/api/${endpoint}`
}
