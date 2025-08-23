import { forwardRef, useContext, useEffect, useState, type ReactElement } from "react"
import type Color from "../../model/Color";
import DOMPurify from 'dompurify';
import type Message from "../../model/Message";
import { useTranslation } from "react-i18next";
import { SessionRenderingContextProvider } from "../../context/SessionRenderingContext";

interface MessageFormProps {
    msg: Message;
}

const MessageForm = forwardRef((
    { msg }: MessageFormProps,
    _
) => {
    const [content, setContent] = useState("");
    const [dateStr, setDateStr] = useState("");
    const [username, setUsername] = useState("");
    const [character, setCharacter] = useState<string | null>(null); // null for system messages that doesn't show an author
    const [color, setColor] = useState<Color | null>(null);

    let ctx = useContext(SessionRenderingContextProvider);
    let users = msg.authors ? ctx.getUsers(msg.authors!) : [];
    
    let { t } = useTranslation();

    let cssTag = "";
    if (msg.ackId !== null) cssTag = "sending";
    else if (msg.flag === "IsSystem") cssTag = "system";
    else if (msg.flag === "IsError") cssTag = "error";

    useEffect(() => {
        if (msg.authors !== null) {
            // Update profile picture
            // Update character inside the PFP
            if (users.length === 0) { // Guest mode
                setCharacter("G");
                setColor({ r: 53, g: 53, b: 53 });
                setUsername("Guest");
            }
            else if (users.length === 1) { // Only one user, just need to take the current one!
                const u = users[0];
                setCharacter(u.character);
                setColor({ r: u.color.r, g: u.color.g, b: u.color.b });
                setUsername(u.username);
            } else { // There are many users, we do the average of the symbol on their PFP
                let arr: Array<number> = [];
                const characters = users.map(x => x.character).sort((a, b) => b.length - a.length);
                for (let i = 0; i < characters[0].length; i++)
                {
                    arr.push(characters[0].codePointAt(i)!);
                }
                for (const c of characters.slice(1))
                {
                    for (let i = 0; i < c.length; i++)
                    {
                        arr[i] += c.codePointAt(i)!;
                    }
                }
                for (let i in arr)
                {
                    arr[i] = Math.floor(arr[i] / users.length);
                }
                setCharacter(String.fromCodePoint(...arr));

                // Merge all users colors by doing their average
                setColor({
                    r: users.map(x => x.color.r).reduce((a, b) => a + b, 0) / users.length,
                    g: users.map(x => x.color.g).reduce((a, b) => a + b, 0) / users.length,
                    b: users.map(x => x.color.b).reduce((a, b) => a + b, 0) / users.length
                });
                setUsername(users.map(x => x.username).join(", "));
            }
        }
        else
        { // System messages don't have an author
            setCharacter(null);
            setUsername("")
        }
    }, [msg.authors])

    useEffect(() => {
        let tmp = msg.content;
        tmp = ctx.parseEmojis(tmp);
        tmp = ctx.parseMarkdown(tmp);
        setContent(tmp);
    }, [msg.content])

    useEffect(() => {
        let format: Intl.DateTimeFormatOptions = {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit"
        }
        setDateStr(msg.date.toLocaleDateString(t("iso3166"), format));
    }, [msg.date])

    return (
    <div className={`container message is-flex-grow-0 ${cssTag}`}>
        <div className="is-flex">
            {
                character === null || color === null ? <div className="pfp"></div>
                : <div className="pfp" style={{
                    background: `rgb(${color.r}, ${color.g}, ${color.b})`
                }}>{character}</div>
            }
            <div className="message-main">
                <small className="date">{dateStr}</small>
                <h2 className="subtitle">{username}</h2>
                <p className="content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}></p>
                <div className="rich-preview is-flex"></div>
                <div className="attachment-info is-hidden"></div>
            </div>
        </div>
    </div>
    )
});

export default MessageForm;