import { useContext, useEffect, useState, type ReactElement } from 'react'
import { SessionRenderingContextProvider } from '../../context/SessionRenderingContext';
import { t } from 'i18next';

export default function ServerSelectionForm () {
    let [serverListDisplay, setServerListDisplay] = useState<Array<ReactElement>>([]);
    let [channelListDisplay, setChannelListDisplay] = useState<Array<ReactElement>>([]);
    let ctx = useContext(SessionRenderingContextProvider);
    
    const [r, forceRefresh] = useState(0);
    const [showChannels, setShowChannels] = useState(false);

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    ctx.refreshServerDisplayState = refreshPage;

    useEffect(() => {
        let servs: Array<ReactElement> = [];
        let chans: Array<ReactElement> = [];
        for (let ns of ctx.sessions) {
            servs.push(<p className="instance-preview" key={ns.instance}>
                {ns.instance}
            </p>)

            let entries = Object.entries(ns.messaging.servers);
            for (let [key, value] of entries)
            {
                const isCurrentServer = ctx.isCurrentServer(ns, parseInt(key));
                servs.push(
                    <button key={value.name} className={"button profile is-flex is-flex-wrap-wrap notif-container " + (isCurrentServer ? "is-primary" : "")} onClick={() => {
                        ctx.setCurrentServer(parseInt(key));
                        setShowChannels(p => !p);
                    }}>
                        {
                            Object.values(value.channels).some(x => x.hasPendingNotification)
                            ? <span className="notif"></span>
                            : <></>
                        }
                        <div className="pfp" style={{
                            background: `rgb(${value.color.r}, ${value.color.g}, ${value.color.b})`
                        }}>{value.character}
                        </div>
                        <p>{value.name}</p>
                    </button>
                );

                if (isCurrentServer) {
                    let chanEntries = Object.entries(ctx.getCurrentServer()!.channels);
                    for (let [chanKey, chanValue] of chanEntries) {
                        const isCurrentChannel = ctx.isCurrentChannel(ns, parseInt(key), parseInt(chanKey));
                        chans.push(
                            <button key={chanKey} className={"button notif-container " + (isCurrentChannel ? "is-primary" : "")} onClick={() => {
                                ctx.setCurrentChannel(parseInt(chanKey));
                                setShowChannels(false);
                            }}>
                                {
                                    chanValue.hasPendingNotification
                                    ? <span className="notif"></span>
                                    : <></>
                                }
                                <p>{chanValue.name}</p>
                            </button>
                        );
                    }
                }
            }
            if (ctx.amIAdmin()) {
                servs.push(
                    <button key={`${ns.instance}-new`} className="button profile is-flex is-flex-wrap-wrap" onClick={() => {
                        ctx.createNewServer();
                    }}>
                        <div className="pfp">
                            <span className="material-symbols-outlined small-icon">add</span>
                        </div>
                        <p>{t("serverSelection.add")}</p>
                    </button>
                );
            }
        }
        setServerListDisplay(servs);
        setChannelListDisplay(chans);
    }, [r]);

    return (
    <div className="is-flex no-gap">
        <div id="server-list">
            {serverListDisplay}
        </div>
        <div id="channel-list" className={showChannels ? "is-active" : ""}>
            {channelListDisplay}
        </div>
    </div>
    )
}