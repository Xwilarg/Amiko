import { PasswordModal } from "@/components/PasswordModal";
import { Message } from "@/components/Message"
import { FlatList, Text, View } from "react-native";

export default function Index() {
    return (
        <View
        style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        }}
        >
            <PasswordModal callback={(pwd: string) => {submitPassword(pwd)}}></PasswordModal>

            <FlatList
                data={messages}
                renderItem={({item}) => <Message date={item.date.toLocaleString()} name={item.name} message={item.message} />}
                keyExtractor={item => item.id}
            >
                
            </FlatList>
        </View>
    );
}

// Access token to the backend
let token: string | null = null;

// Current user username
let myUsername = "";

// All infos about various users
let userInfo = null;

// Current message ID
let currId = 0;

/*
const apiTarget = "amiko.zirk.eu";
const isSecure = true;
*/
const apiTarget = "localhost:5129";
const isSecure = false;

let messages: MessageCmp[] = [];

class MessageCmp {
    constructor(date: Date, name: string | null, message: string, id: string) {
        this.date = date;
        this.name = name;
        this.message = message;
        this.id = id;
    }

    date: Date;
    name: string | null;
    message: string;
    id: string;
}

class EpoxDate
{
    constructor(seconds: number, nanos: number) {
        this.seconds = seconds;
        this.nanos = nanos;
    }

    seconds: number;
    nanos: number;
}

function sendMessageInternal(msg: MessageCmp) {
    messages.push(msg);
}

function sendSystemMessage(text: string) {
    sendMessageInternal(new MessageCmp(new Date(), null, text, crypto.randomUUID()));
}

function sendErrorMessage(text: string) {
    sendMessageInternal(new MessageCmp(new Date(), null, text, crypto.randomUUID()));
}

function sendMessage(date: EpoxDate, name: string, text: string) {
    sendMessageInternal(new MessageCmp(new Date(date.seconds * 1000 + date.nanos / 1e6), name, text, crypto.randomUUID()));
}

function sendMyMessage(text: string, id: string) {
    sendMessageInternal(new MessageCmp(new Date(), myUsername, text, crypto.randomUUID()));
}

function submitPassword(pwd: string) {
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
        //await filesystem.writeAsync(token);
        openMessageConnection();
    })
    .catch((err) => {
        alert(`Login failed: ${err}`)
    });
}

let socket;

function openMessageConnection() {
    console.log(token);
}

function createWebsocketUrl(): string {
    return `ws${isSecure ? 's' : ''}://${apiTarget}/ws`
}
function createHttpUrl(endpoint: string): string {
    return `http${isSecure ? 's' : ''}://${apiTarget}/api/${endpoint}`
}

sendSystemMessage(`Connecting...`);