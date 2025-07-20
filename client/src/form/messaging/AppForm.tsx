import { useEffect, useState, type ReactElement } from 'react'
import NetworkSession from '../../instance/NetworkSession';

export default function AppForm() {
    const [sessions, setSessions] = useState<Array<NetworkSession>>([]);
    const [r, forceRefresh] = useState(0);

    function refreshPage() {
        forceRefresh(r + 1);
    }

    useEffect(() => {
        // @ts-ignore
        filesystem.readTokenAsync().then((storedSessions: Record<string, string>) => {
            let tmpSessions = [];
            for (let [key, value] of Object.entries(storedSessions)) {
                tmpSessions.push(new NetworkSession(key, value, refreshPage));
            }
            setSessions(tmpSessions);
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
        <div className="server-list">
            {serverListDisplay}
        </div>
        Welcome inside Amiko!
    </div>
    )
}