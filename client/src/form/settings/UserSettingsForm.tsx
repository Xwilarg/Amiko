import { useContext, useEffect, useState, type ReactElement } from "react";
import type Color from "../../model/Color";
import { useTranslation } from "react-i18next";
import { SessionRenderingContextProvider } from "../../context/SessionRenderingContext";
import type User from "../../model/User";

interface AltUserDisplay
{
    user: User;
    username: string;
    character: string;
    color: Color;
    prefix: string;
}

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
    let [altUsers, setAltUsers] = useState<Array<AltUserDisplay>>([]);
    let [altUsersListDisplay, setAltUsersListDisplay] = useState<Array<ReactElement>>([]);

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }

    ctx.refreshUserSettings = refreshPage;
    
    let { t } = useTranslation();

    function onSubmit(e: React.MouseEvent<HTMLInputElement>) {
        ctx.updateUserInfo(ctx.getCurrentInstance().messaging.mainUser!, username, color, character, null);
    }

    function prependZero(str: string) {
        if (str.length == 1) return `0${str}`;
        return str;
    }

    function colorToHex(color: Color): string {
        return `#${prependZero(color.r.toString(16))}${prependZero(color.g.toString(16))}${prependZero(color.b.toString(16))}`;
    }

    function hexToColor(value: string): Color {
        return {
            r: parseInt(value.substring(1, 3), 16),
            g: parseInt(value.substring(3, 5), 16),
            b: parseInt(value.substring(5, 7), 16)
        }
    }

    useEffect(() => {
        let m = ctx.getCurrentInstance().messaging;
        let me = m.mainUser;
        let allAlts = m.getInfoFromIdList(m.possibleUsers.filter(x => x != me)); // TODO: remove the main user

        // Update users shown on display
        let currAlts: Array<AltUserDisplay> = [];
        for (let user of allAlts) {
            let elem = altUsers.find(x => x.user.id === user.id);
            if (elem)
            {
                currAlts.push({
                    user: elem.user,
                    character: elem.character,
                    username: elem.username,
                    color: elem.color,
                    prefix: elem.prefix
                });
            } else {
                currAlts.push({
                    user: user,
                    character: user.character,
                    username: user.username,
                    color: user.color,
                    prefix: user.prefix ?? ""
                });
            }
        }

        setAltUsers([...currAlts]);
    }, [r]);
    
    useEffect(() => {
        let users: Array<ReactElement> = []
        for (let user of altUsers) {
            users.push(<tr key={user.user.id}>
                <td><input className="input" type="text" value={user.prefix} onChange={(e) => {
                    user.prefix = e.target.value;
                    setAltUsers([...altUsers]);
                }} /></td>
                <td><input className="input" type="color" value={colorToHex(user.color)} onChange={(e) => {
                    user.color = hexToColor(e.target.value);
                    setAltUsers([...altUsers]);
                }} /></td>
                <td><input className="input" type="text" value={user.character} onChange={(e) => {
                    user.character = e.target.value ? Array.from(e.target.value)[0] : "";
                    setAltUsers([...altUsers]);
                }} /></td>
                <td><input className="input" type="text" value={user.username} onChange={(e) => {
                    user.username = e.target.value;
                    setAltUsers([...altUsers]);
                }} /></td>
                <td>
                    <button className="button is-primary" onClick={
                        () => { ctx.updateUserInfo(user.user.id, user.username, user.color, user.character, user.prefix ?? null) }
                    }>
                        <span className="material-symbols-outlined small-icon">save</span>
                    </button>
                </td>
                <td>
                    <button className="button is-warning" onClick={
                        () => {
                            user.prefix = user.user.prefix ?? "";
                            user.color = user.user.color;
                            user.character = user.user.character;
                            user.username = user.user.username;
                        }
                    }>
                        <span className="material-symbols-outlined small-icon">undo</span>
                    </button>
                </td>
                <td>
                    <button className="button is-danger" onClick={
                        () => { ctx.deleteUser(user.user.id); }
                    }>
                        <span className="material-symbols-outlined small-icon">delete</span>
                    </button>
                </td>
            </tr>)
        }
        setAltUsersListDisplay(users);
    }, [altUsers]);

    return <>
        <div className="field">
            <label className="label">{t("settings.user.color")}</label>
            <div className="control">
                <input className="input" type="color" 
                value={colorToHex(color)} onChange={(e) => setColor(hexToColor(e.target.value))}
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
            <label className="label">{t("settings.user.username")}</label>
            <div className="control">
                <input className="input" type="text"
                value={username} onChange={(e) => setUsername(e.target.value)}
            />
            </div>
        </div>
        <div className="field pt-3">
            <input className="input is-primary" type="submit" onClick={onSubmit} />
        </div>
        <div className="has-text-left">
            <table className="table" id="alt-user-display-settings">
                <thead>
                    <tr>
                        <th>{t("settings.user.prefix")}</th>
                        <th>{t("settings.user.color")}</th>
                        <th>{t("settings.user.symbol")}</th>
                        <th>{t("settings.user.username")}</th>
                        <th></th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {altUsersListDisplay} 
                </tbody>
            </table>
            <button className="button is-primary" onClick={() => {ctx.createNewAltUser()}}>
                <span className="material-symbols-outlined small-icon">add</span>
            </button>
        </div>
    </>
}