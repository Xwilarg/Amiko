import { useContext, useEffect, useState } from "react";
import { SessionRenderingContextProvider, type DisplayMode } from "../../context/SessionRenderingContext";
import { useTranslation } from "react-i18next";

export default function GeneralSettingsForm () {
    let ctx = useContext(SessionRenderingContextProvider);
    let { t } = useTranslation();
    const [displayMode, setDisplayMode] = useState<DisplayMode>("Default");
    const [needRefresh, setNeedRefresh] = useState<boolean>(false);

    useEffect(() => {
        ctx.getDisplayModeAsync()
            .then(value => {
                setDisplayMode(value);
            })
    }, []);
    let refreshChanges = needRefresh ?
    <>
        <p className="help is-danger">{t("settings.general.refreshNeeded")}</p>
        <br/>
        <button className="button is-info" onClick={(e) => { window.location.reload(); }}>{t("settings.general.refresh")}</button>
    </>
    : <></>
    return <>
        <div className="field">
            <label className="label">{t("settings.general.display.title")}</label>
            <div className="control">
                <div className="select">
                    <select onChange={async (e) => {
                        const mode = e.target.value as DisplayMode;
                        setDisplayMode(mode);
                        await ctx.setDisplayModeAsync(mode);
                        setNeedRefresh(mode != ctx.displayMode);
                    }} value={displayMode}>
                        <option value="Default">{t("settings.general.display.default")}</option>
                        <option value="Minimalist">{t("settings.general.display.minimalist")}</option>
                    </select>
                </div>
            </div>
        </div>
        <div className="field">
            <label className="label">{t("settings.general.exportTitle")}</label>
            <div className="control">
                <button className="button" onClick={(e) => {
                    if (ctx.getCurrentServer().isEphemeral) {
                        ctx.sendWarning(t("settings.general.exportDisabled"));
                    } else {
                        ctx.downloadExport();
                    }
                }}>{t("settings.general.exportDesc")}</button>
            </div>
        </div>
        {refreshChanges}
    </>
}