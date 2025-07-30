import { useContext, useState, type ReactElement } from 'react'
import { SessionRenderingContextProvider } from '../../context/SessionRenderingContext';

export default function ServerSelectionForm () {
    let serverListDisplay: Array<ReactElement> = []
    let ctx = useContext(SessionRenderingContextProvider);
    
    const [r, forceRefresh] = useState(0);

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    ctx.refreshServerDisplayState = refreshPage;

    for (let ns of ctx.sessions) {
        let entries = Object.entries(ns.messaging.servers);
        for (let [key, value] of entries)
        {
            serverListDisplay.push(
                <div key={value.name} className={"button profile is-flex is-flex-wrap-wrap notif-container " + (ctx.isCurrentServer(ns, parseInt(key)) ? "is-primary" : "")}>
                    <div className="pfp" style={{
                        background: `rgb(${value.color.r}, ${value.color.g}, ${value.color.b})`
                    }}>{value.character}
                    </div>
                    <p>{value.name}</p>
                </div>
            )
        }
    }

    return (
    <div className="is-flex">
        <div className="server-list">
            {serverListDisplay}
        </div>
    </div>
    )
}