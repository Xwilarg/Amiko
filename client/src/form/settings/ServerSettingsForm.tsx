import { useContext, useEffect, useState, type ReactElement } from "react";
import type Color from "../../model/Color";
import { useTranslation } from "react-i18next";
import { SessionRenderingContextProvider } from "../../context/SessionRenderingContext";

export default function ServerSettingsForm () {
    let ctx = useContext(SessionRenderingContextProvider);
    const [character, setCharacter] = useState<string>(() => {
        return ctx.getCurrentServer().character;
    });
    const [color, setColor] = useState<Color>(() => {
        return ctx.getCurrentServer().color;
    });
    const [name, setName] = useState<string>(() => {
        return ctx.getCurrentServer().name;
    });
    const [allowsGuest, setAllowsGuest] = useState<boolean>(() => {
        return ctx.getCurrentServer().allowsGuest;
    });
    const [isEphemeral, setIsEphemeral] = useState<boolean>(() => {
        return ctx.getCurrentServer().isEphemeral;
    });
    let [channelListDisplay, setChannelListDisplay] = useState<Array<ReactElement>>([]);
    const [r, forceRefresh] = useState(0);

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    
    let { t } = useTranslation();

    ctx.refreshServerSettings = refreshPage;

    function onSubmit(e: React.MouseEvent<HTMLInputElement>) {
        ctx.updateServerInfo(name, color, character, allowsGuest, isEphemeral);
    }

    function prependZero(str: string) {
        if (str.length == 1) return `0${str}`;
        return str;
    }

    useEffect(() => {
        let chans: Array<ReactElement> = []
        let s = ctx.getCurrentServer()
        for (let [key, value] of Object.entries(s.channels))
        {
            chans.push(<div className="is-flex" key={key}>
                <button className="button settings-chan-preview" disabled>{value.name}</button>
                <button className="button is-info" onClick={
                    () => {
                        const newName = prompt();
                        if (newName) {
                            ctx.updateChannelName(parseInt(key), newName);
                        }
                    }
                }>
                    <span className="material-symbols-outlined small-icon">edit</span>
                </button>
                <button className="button is-danger" onClick={
                    () => { if (confirm(t("settings.common.destructive"))) {
                        ctx.deleteChannel(parseInt(key));
                    } }
                }>
                    <span className="material-symbols-outlined small-icon">delete</span>
                </button>
            </div>)
        }
        setChannelListDisplay(chans);
    }, [r]);

    return <>
        <div className="field">
            <label className="label">{t("settings.server.name")}</label>
            <div className="control">
                <input className="input" type="text"
                value={name} onChange={(e) => setName(e.target.value)}
            />
            </div>
        </div>
        <div className="field">
            <label className="label">{t("settings.server.symbol")}</label>
            <div className="control">
                <input className="input" type="text"
                value={character} onChange={(e) => setCharacter(e.target.value ? Array.from(e.target.value)[0] : "")}
            />
            </div>
        </div>
        <div className="field">
            <label className="label">{t("settings.server.color")}</label>
            <div className="control">
                <input className="input" type="color"
                value={`#${prependZero(color.r.toString(16))}${prependZero(color.g.toString(16))}${prependZero(color.b.toString(16))}`} onChange={(e) =>
                    setColor({
                        r: parseInt(e.target.value.substring(1, 3), 16),
                        g: parseInt(e.target.value.substring(3, 5), 16),
                        b: parseInt(e.target.value.substring(5, 7), 16)
                    })
                }
            />
            </div>
        </div>
        <div className="field">
            <label className="label">
                {t("settings.server.allowsGuest")}<br/>
                <small>{t("settings.server.allowsGuestExpl")}</small>
            </label>
            <label className="switch is-rounded">
                <input type="checkbox" checked={allowsGuest} onChange={(e) => setAllowsGuest(e.target.checked)}/>
                <span className="check"></span>
            </label>
        </div>
        <div className="field">
            <label className="label">
                {t("settings.server.isEphemeral")}<br/>
                <small>{t("settings.server.isEphemeralExpl")}</small>
            </label>
            <label className="switch is-rounded">
                <input type="checkbox" checked={isEphemeral} onChange={(e) => setIsEphemeral(e.target.checked)}/>
                <span className="check"></span>
            </label>
        </div>
        <div className="field pt-3">
            <input className="input is-primary" type="submit" onClick={onSubmit} />
        </div>
        <hr/>
        <div className="container has-text-left">
            {channelListDisplay}
            <button className="button is-primary settings-chan-new" onClick={() => {ctx.createNewChannel()}}>
                <span className="material-symbols-outlined small-icon">add</span>
            </button>
        </div>
        <div className="container has-text-left mt-5">
            <button className="button is-danger" onClick={() => {
                if (confirm(t("settings.common.destructive"))) {
                    ctx.deleteServer();
                }
            }}>
                <span className="material-symbols-outlined small-icon">delete</span> {t("settings.server.delete")}
            </button>
        </div>
    </>
}