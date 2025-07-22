import React, { createContext, useEffect, useRef, useState, type ReactElement } from 'react'
import NetworkSession from '../../instance/NetworkSession';
import ServerSelectionForm from './ServerSelectionForm';
import MessageContainerForm from './MessageContainerForm';
import type Message from '../../model/Message';
import type { MessageFlag } from '../../model/MessageFlag';

export const SessionContext = createContext<NetworkSession | null>(null);

let currInstance = 0;
let currServ = 0;
let currChannel = 0;

export default function AppForm() {
    const [sessions, setSessions] = useState<Array<NetworkSession>>([]);
    const [r, forceRefresh] = useState(0);

    // @ts-ignore
    const ref = React.createRef();
    const msgRef = React.createRef();

    function refreshPage() { // Need to clean this
        // @ts-ignore
        ref.current.refresh();
        forceRefresh(r + 1);
    }

    function isCurrentChannel(s: NetworkSession, servId: number, chanId: number) {
        return s.instance == sessions[currInstance].instance &&
            currServ == servId &&
            currChannel == chanId;
    }

    function sendMessage(msg: Message, type: MessageFlag) {
        // @ts-ignore
        msgRef.current.sendMessage(msg);
    }

    function clearAllMessages() {

    }

    function setMessages(msgs: Message[]) {

    }

    useEffect(() => {
        // @ts-ignore
        filesystem.readTokenAsync().then((storedSessions: Record<string, string>) => {
            for (let [key, value] of Object.entries(storedSessions)) {
                sessions.push(new NetworkSession(key, value, refreshPage, sendMessage, isCurrentChannel));
            }
        });
    }, [])


    let serverListDisplay: Array<ReactElement> = []
    let tmpS: Array<NetworkSession> = sessions;
    for (let ns of tmpS) {
        for (let [key, value] of Object.entries(ns.messaging.servers))
        serverListDisplay.push(
            <div key={value.name} className="button profile is-flex is-flex-wrap-wrap is-primary notif-container">
                <div className="pfp" style={{
                    background: `rgb(${value.color.r}, ${value.color.g}, ${value.color.b})`
                }}>{value.character}
                </div>
                <p>{value.name}</p>
            </div>
        )
    }

    return (
    <div className="is-flex">
        <ServerSelectionForm sessions={sessions} activeIndex={currServ} ref={ref}/>
        <SessionContext.Provider value={sessions[currInstance]}>
            <MessageContainerForm ref={msgRef} />
        </SessionContext.Provider>
    </div>
    )
}