import { forwardRef, useImperativeHandle, useState, type ReactElement } from 'react'
import NetworkSession from '../../instance/NetworkSession';

interface ServerSelectionFormProps {
    sessions: Array<NetworkSession>;
    activeIndex: number;
}

const ServerSelectionForm = forwardRef((
    { sessions, activeIndex }: ServerSelectionFormProps,
    ref
) => {
    const [r, forceRefresh] = useState(0);

    useImperativeHandle(ref, () => ({
        refresh: () => { forceRefresh(r + 1); }
    }));


    let serverListDisplay: Array<ReactElement> = []
    let index = 0;
    for (let ns of sessions) {
        for (let [key, value] of Object.entries(ns.messaging.servers))
        serverListDisplay.push(
            <div key={value.name} className={"button profile is-flex is-flex-wrap-wrap notif-container " + (activeIndex === index ? "is-primary" : "")}>
                <div className="pfp" style={{
                    background: `rgb(${value.color.r}, ${value.color.g}, ${value.color.b})`
                }}>{value.character}
                </div>
                <p>{value.name}</p>
            </div>
        )
        index++;
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