import { useContext, useEffect, useState, type ReactElement } from 'react'
import { SessionRenderingContextProvider } from '../../context/SessionRenderingContext';

export default function ServerSelectionForm () {
    let [serverListDisplay, setServerListDisplay] = useState<Array<ReactElement>>([]);
    let [channelListDisplay, setChannelListDisplay] = useState<Array<ReactElement>>([]);
    let ctx = useContext(SessionRenderingContextProvider);
    
    const [r, forceRefresh] = useState(0);

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    ctx.refreshServerDisplayState = refreshPage;

    useEffect(() => {
        console.log("show")
        let servs: Array<ReactElement> = [];
        let chans: Array<ReactElement> = [];
        for (let ns of ctx.sessions) {
            let entries = Object.entries(ns.messaging.servers);
            for (let [key, value] of entries)
            {
                const isCurrentServer = ctx.isCurrentServer(ns, parseInt(key));
                servs.push(
                    <div key={value.name} className={"button profile is-flex is-flex-wrap-wrap " + (isCurrentServer ? "is-primary" : "")}>
                        <div className="pfp" style={{
                            background: `rgb(${value.color.r}, ${value.color.g}, ${value.color.b})`
                        }}>{value.character}
                        </div>
                        <p>{value.name}</p>
                    </div>
                );

                if (isCurrentServer) {
                    let chanEntries = Object.entries(ctx.getCurrentServer().channels);
                    for (let [chanKey, chanValue] of chanEntries) {
                        const isCurrentChannel = ctx.isCurrentChannel(ns, parseInt(key), parseInt(chanKey));
                        chans.push(
                            <div key={value.name} className={"button " + (isCurrentChannel ? "is-primary" : "")}>
                                <p>{chanValue.name}</p>
                            </div>
                        );
                    }
                }
            }
        }
        setServerListDisplay(servs);
        setChannelListDisplay(chans);
    }, [r]);

    return (
    <div className="fixed-grid">
        <div className="grid is-gapless">
            <div id="server-list">
                {serverListDisplay}
            </div>
            <div id="channel-list">
                {channelListDisplay}
            </div>
        </div>
    </div>
    )
}