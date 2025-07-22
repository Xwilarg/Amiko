import { forwardRef, useImperativeHandle, useState, type ReactElement } from 'react'
import NetworkSession from '../../instance/NetworkSession';
import type SessionRenderingContext from '../../context/SessionRenderingContext';

interface ServerSelectionFormProps {
    context: SessionRenderingContext;
}

const ServerSelectionForm = forwardRef((
    { context }: ServerSelectionFormProps,
    ref
) => {
    const [r, forceRefresh] = useState(0);

    useImperativeHandle(ref, () => ({
        refresh: () => { forceRefresh(r + 1); }
    }));


    let serverListDisplay: Array<ReactElement> = []
    if (context) {
        for (let ns of context.sessions) {
            let entries = Object.entries(ns.messaging.servers);
            for (let i = 0; i < entries.length; i++)
            {
                const [key, value] = entries[i];
                serverListDisplay.push(
                    <div key={value.name} className={"button profile is-flex is-flex-wrap-wrap notif-container " + (context.isCurrentServer(ns, i) ? "is-primary" : "")}>
                        <div className="pfp" style={{
                            background: `rgb(${value.color.r}, ${value.color.g}, ${value.color.b})`
                        }}>{value.character}
                        </div>
                        <p>{value.name}</p>
                    </div>
                )
            }
        }
    }

    return (
    <div className="is-flex">
        <div className="server-list">
            {serverListDisplay}
        </div>
    </div>
    )
});

export default ServerSelectionForm;