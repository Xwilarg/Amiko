import { useContext, useState } from "react";
import type Color from "../../model/Color";
import { useTranslation } from "react-i18next";
import { SessionRenderingContextProvider } from "../../context/SessionRenderingContext";

export default function UserSettingsForm () {
    let ctx = useContext(SessionRenderingContextProvider);
    const [character, setCharacter] = useState<string>(() => {
        return ctx.getCurrentClaimUser().character;
    });
    const [color, setColor] = useState<Color>(() => {
        return ctx.getCurrentClaimUser().color;
    });
    const [username, setUsername] = useState<string>(() => {
        return ctx.getCurrentClaimUser().username;
    });
    const [r, forceRefresh] = useState(0);

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }

    ctx.refreshUserSettings = refreshPage;
    
    let { t } = useTranslation();

    function onSubmit(e: React.MouseEvent<HTMLInputElement>) {
        ctx.updateUserInfo(username, color, character);
    }

    function prependZero(str: string) {
        if (str.length == 1) return `0${str}`;
        return str;
    }

    return <>
        <div className="field">
            <label className="label">{t("settings.user.username")}</label>
            <div className="control">
                <input className="input" type="text"
                value={username} onChange={(e) => setUsername(e.target.value)}
            />
            </div>
        </div>
        <div className="field">
            <label className="label">{t("settings.user.symbol")}</label>
            <div className="control">
                <input className="input" type="text"
                value={character} onChange={(e) => setCharacter(e.target.value ? Array.from(e.target.value)[0] : "")}
            />
            </div>
        </div>
        <div className="field">
            <label className="label">{t("settings.user.color")}</label>
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
        <div className="field pt-3">
            <input className="input is-primary" type="submit" onClick={onSubmit} />
        </div>
    </>
}