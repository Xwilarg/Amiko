import { useState } from 'react'
import NetworkSession from '../../network/NetworkSession';

export default function AppForm() {
    // @ts-ignore
    const [sessions, setSessions] = useState<Array<NetworkSession>([]);

    let tmpSessions = [];
    // @ts-ignore
    let storedSessions: Record<string, string> = filesystem.readTokenAsync();
    for (let [key, value] of Object.entries(storedSessions)) {
        tmpSessions.push(new NetworkSession(key, value));
    }
    setSessions(tmpSessions);

    return (
    <div className="modal is-active">
        Welcome inside Amiko!
    </div>
    )
}