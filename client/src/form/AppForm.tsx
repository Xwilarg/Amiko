import React, { createContext, useContext, useEffect, useRef, useState, type ReactElement } from 'react'
import NetworkSession from '../instance/NetworkSession';
import ServerSelectionForm from './messaging/ServerSelectionForm';
import MessageContainerForm from './messaging/MessageContainerForm';
import SessionRenderingContext from '../context/SessionRenderingContext';
import NavbarForm from './navbar/NavbarForm';

export const SessionRenderingContextProvider = createContext<SessionRenderingContext>(new SessionRenderingContext());

export default function AppForm() {
    const [sessions, setSessions] = useState<Array<NetworkSession>>([]);
    const [r, forceRefresh] = useState(0);

    const msgRef = React.createRef();
    const context = useContext(SessionRenderingContextProvider);
    context.refMsg = msgRef

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }

    useEffect(() => {
        // @ts-ignore
        filesystem.readTokenAsync().then((storedSessions: Record<string, string>) => {
            for (let [key, value] of Object.entries(storedSessions)) {
                context.addInstance(key, value, refreshPage);
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
        <SessionRenderingContextProvider.Provider value={context}>
            <NavbarForm />
            <div className="is-flex">
                <ServerSelectionForm />
                <MessageContainerForm ref={msgRef} />
            </div>
        </SessionRenderingContextProvider.Provider>
    )
}