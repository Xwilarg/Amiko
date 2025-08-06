import { useContext, useEffect, useState } from "react";
import { SessionRenderingContextProvider, type DisplayMode } from "../../context/SessionRenderingContext";
import { useTranslation } from "react-i18next";

export default function GeneralSettingsForm () {
    let ctx = useContext(SessionRenderingContextProvider);
    let { t } = useTranslation();
    const [displayMode, setDisplayMode] = useState<DisplayMode>("Default");

    useEffect(() => {
        ctx.getDisplayModeAsync()
            .then(value => {
                setDisplayMode(value);
            })
    }, []);
    return <>
        <div className="field">
            <label className="label">{t("settings.general.display.title")}</label>
            <div className="control">
                <div className="select">
                    <select onChange={async (e) => {
                        const mode = e.target.value as DisplayMode;
                        setDisplayMode(mode);
                        await ctx.setDisplayModeAsync(mode);
                    }} value={displayMode}>
                        <option value="Default">{t("settings.general.display.default")}</option>
                        <option value="Minimalist">{t("settings.general.display.minimalist")}</option>
                    </select>
                </div>
            </div>
        </div>
    </>
}