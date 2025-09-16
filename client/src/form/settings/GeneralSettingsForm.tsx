import { useContext, useEffect, useState, type ReactElement } from "react";
import { SessionRenderingContextProvider, type DisplayMode, type PingMode, type UserMode } from "../../context/SessionRenderingContext";
import { useTranslation } from "react-i18next";

export default function GeneralSettingsForm () {
    let ctx = useContext(SessionRenderingContextProvider);
    let { t } = useTranslation();

    const [displayMode, setDisplayMode] = useState<DisplayMode>("Default");
    const [originalDisplayMode, setOriginalDisplayMode] = useState<DisplayMode>("Default");
    const [needRefresh, setNeedRefresh] = useState<boolean>(false);
    const [isBoldReading, setIsBoldReading] = useState<boolean>(false);
    const [pingMode, setPingMode] = useState<PingMode>("PingOnly");
    const [isHideNotification, setIsHideNotification] = useState<boolean>(false);
    const [userMode, setUserMode] = useState<UserMode>("SingleUser");

    let [userList, setUserList] = useState<Array<ReactElement>>([]);
    let [r, setRefresh] = useState<number>(0);

    useEffect(() => {
        setOriginalDisplayMode(ctx.getDisplayMode());
        setDisplayMode(ctx.getDisplayMode());
        setIsBoldReading(ctx.getBoldReading());
        setPingMode(ctx.getPingMode());
        setIsHideNotification(ctx.getHideNotification());
    }, []);

    useEffect(() => {
        let data = [];
        
        let m = ctx.getCurrentInstance().messaging;
        let allAlts = m.getInfoFromIdList(m.possibleUsers);

        let curr = ctx.getSpeakers();

        for (let u of allAlts) {
            data.push(
                <button key={`${u.id}`} className={"button profile is-flex is-flex-wrap-wrap" + (curr.includes(u.id) ? " is-primary" : "")} onClick={() => {
                    if (userMode === "SingleUser") {
                        ctx.setSpeakers([ u.id ]);
                    } else {
                        const index = curr.indexOf(u.id);
                        if (index === -1) {
                            curr.push(u.id);
                        } else if (curr.length > 1) {
                            curr.splice(index, 1);
                        }
                        ctx.setSpeakers(curr);
                    }
                    setRefresh(x => x + 1);
                }}>
                    <div className="pfp" style={{
                        background: `rgb(${u.color.r}, ${u.color.g}, ${u.color.b})`
                    }}>{u.character}
                    </div>
                    <p>{u.username}</p>
                </button>
            )
        }
        setUserList(data);
    }, [r, userMode]);

    let refreshChanges = needRefresh ?
    <>
        <p className="help is-danger">{t("settings.general.refreshNeeded")}</p>
        <br/>
        <button className="button is-info" onClick={(e) => { window.location.reload(); }}>{t("settings.general.refresh")}</button>
    </>
    : <></>
    return <>
        <div className="field">
            <label className="label">
                {t("settings.general.boldReading")}<br/>
                <small></small>
            </label>
            <label className="switch is-rounded">
                <input type="checkbox" checked={isBoldReading} onChange={async (e) => {
                    setIsBoldReading(e.target.checked);
                    await ctx.setBoldReadingAsync(e.target.checked);
                    // @ts-ignore
                    ctx.refMsg.current.refreshContent();
                }}/>
                <span className="check"></span>
            </label>
        </div>
        <div className="field">
            <label className="label">{t("settings.general.exportTitle")}</label>
            <div className="control">
                <button className="button" onClick={(e) => {
                    if (ctx.getCurrentServer()?.isEphemeral ?? false) {
                        ctx.sendWarning(t("settings.general.exportDisabled"));
                    } else {
                        ctx.downloadExport();
                    }
                }}>{t("settings.general.exportDesc")}</button>
            </div>
        </div>
        <div className="field">
            <label className="label">{t("settings.general.display.title")}</label>
            <div className="control">
                <div className="select">
                    <select onChange={async (e) => {
                        const mode = e.target.value as DisplayMode;
                        setDisplayMode(mode);
                        await ctx.setDisplayModeAsync(mode);
                        setNeedRefresh(mode != originalDisplayMode);
                    }} value={displayMode}>
                        <option value="Default">{t("settings.general.display.default")}</option>
                        <option value="Minimalist">{t("settings.general.display.minimalist")}</option>
                    </select>
                </div>
            </div>
        </div>
        {refreshChanges}
        <hr/>
        <div className="field">
            <label className="label">{t("settings.general.notification.title")}</label>
            <div className="control">
                <div className="select">
                    <select onChange={async (e) => {
                        const mode = e.target.value as PingMode;
                        setPingMode(mode);
                        await ctx.setPingModeAsync(mode);
                    }} value={pingMode}>
                        <option value="None">{t("settings.general.notification.none")}</option>
                        <option value="PingOnly">{t("settings.general.notification.pingOnly")}</option>
                        <option value="AllMessages">{t("settings.general.notification.allMessages")}</option>
                    </select>
                </div>
            </div>
        </div>
        <div className="field">
            <label className="label">
                {t("settings.general.hideNotification")}<br/>
                <small></small>
            </label>
            <label className="switch is-rounded">
                <input type="checkbox" checked={isHideNotification} onChange={async (e) => {
                    setIsHideNotification(e.target.checked);
                    await ctx.setHideNotificationAsync(e.target.checked);
                }}/>
                <span className="check"></span>
            </label>
        </div>
        <hr/>
        <div className="field">
            <label className="label">{t("settings.general.userMode.title")}</label>
            <div className="control">
                <div className="select">
                    <select onChange={async (e) => {
                        const mode = e.target.value as UserMode;
                        await ctx.setUserMode(mode);

                        if (mode === "SingleUser") {
                            ctx.setSpeakers([ ctx.getSpeakers()[0] ]);
                        }
                        setUserMode(mode);
                    }} value={userMode}>
                        <option value="SingleUser">{t("settings.general.userMode.singleUser")}</option>
                        <option value="Cofronting">{t("settings.general.userMode.cofronting")}</option>
                    </select>
                </div>
            </div>
        </div>
        <div className="is-flex is-flex-wrap-wrap">
            { userList }
        </div>
    </>
}