import { useEffect, useRef, useState, type ReactElement } from 'react'
import NetworkSession from '../../instance/NetworkSession';
import ServerSelectionForm from './ServerSelectionForm';
import MessageContainerForm from './MessageContainerForm';

export default function AppForm() {
    const [sessions, _] = useState<Array<NetworkSession>>([]);
    const [r, forceRefresh] = useState(0);

    // @ts-ignore
    const ref = useRef();

    function refreshPage() {
        // @ts-ignore
        ref.current.refresh();
    }

    useEffect(() => {
        // @ts-ignore
        filesystem.readTokenAsync().then((storedSessions: Record<string, string>) => {
            for (let [key, value] of Object.entries(storedSessions)) {
                sessions.push(new NetworkSession(key, value, refreshPage));
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
        <ServerSelectionForm sessions={sessions} activeIndex={0} ref={ref}/>
        <MessageContainerForm session={sessions[0]} />
    </div>
    )
}