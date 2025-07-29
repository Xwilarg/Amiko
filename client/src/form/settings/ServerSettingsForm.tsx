import { useContext, useState } from "react";
import { SessionRenderingContextProvider } from "../AppForm";
import type Color from "../../model/Color";
import { useTranslation } from "react-i18next";

export default function ServerSettingsForm () {
    let ctx = useContext(SessionRenderingContextProvider);
    const [character, setCharacter] = useState<string>(() => {
        return ctx.getCurrentServer().character;
    });
    const [color, setColor] = useState<Color>(() => {
        return ctx.getCurrentServer().color;
    });
    
    let { t } = useTranslation();

    return <>
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
                value={`#${color.r.toString(16)}${color.g.toString(16)}${color.b.toString(16)}`} onChange={(e) =>
                    setColor({
                        r: parseInt(e.target.value.substring(1, 3), 16),
                        g: parseInt(e.target.value.substring(3, 5), 16),
                        b: parseInt(e.target.value.substring(5, 7), 16)
                    })
                }
            />
            </div>
        </div>
    </>
}