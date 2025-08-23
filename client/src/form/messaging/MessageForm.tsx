import { forwardRef, useContext, useEffect, useState } from "react"
import type Color from "../../model/Color";
import DOMPurify from 'dompurify';
import { useTranslation } from "react-i18next";
import { SessionRenderingContextProvider } from "../../context/SessionRenderingContext";
import type { DisplayedMessage } from "./MessageContainerForm";

interface MessageFormProps {
    dm: DisplayedMessage;
}

interface DisplayedAttachment {
    url: string;
    mimetype: string;
    source: string;
}

const MessageForm = forwardRef((
    { dm }: MessageFormProps,
    _
) => {
    const [content, setContent] = useState("");
    const [dateStr, setDateStr] = useState("");
    const [username, setUsername] = useState("");
    const [character, setCharacter] = useState<string | null>(null); // null for system messages that doesn't show an author
    const [color, setColor] = useState<Color | null>(null);
    const [attachments, setAttachments] = useState<Array<DisplayedAttachment>>([]);

    let ctx = useContext(SessionRenderingContextProvider);
    let users = dm.msg.authors ? ctx.getUsers(dm.msg.authors!) : [];
    
    let { t } = useTranslation();

    let cssTag = "";
    if (dm.msg.ackId !== null) cssTag = "sending";
    else if (dm.msg.flag === "IsSystem") cssTag = "system";
    else if (dm.msg.flag === "IsError") cssTag = "error";

    useEffect(() => {
        if (dm.msg.authors !== null) {
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
    }, [dm.msg.authors, dm.authorDirty]);

    useEffect(() => {
        let tmp = dm.msg.content;
        tmp = ctx.parseEmojis(tmp);
        tmp = ctx.parseMarkdown(tmp);
        setContent(tmp);

        if (users.length === 0) {
            return; // Don't preview links of guests
        }

        // TODO: Comments below are outdated version, need to add it back in the future
        // Pattern match urls
        // Optionally at the start we can have <XXX:
        // <> specify special formats (by default hide image)
        // XXX: overrides behaviors
        // Regex explanations:
        // First look for "<" (optional)
        // Then look for behavior specification "XXXXX:" (optional)
        // Then we look for the URL, it matches until it find one of the following strings: '^', ' ', '\n', ')', ',', ';', '>', '[end of line]'
        // We check if we have a ">" at the end (optional)
        // const regex = /((<)(([a-zA-Z]+):)?)?(https?:\/\/.+?)(^| |\n|\)|,|;|>|$)(>)?/gm

        setAttachments(atts => {
            atts = atts.filter(x => x.source !== "content");

            const re = /<a [^>]+>([^<]+)<\/a>/g;
            var m;

            do {
                let m = re.exec(tmp);
                if (m) {
                    let url = m[1];
                    atts.push({
                        url: url,
                        mimetype: url.match(/(png|jpg|jpeg|gif|webp)$/m) ? "image/" : "unknown",
                        source: "content"
                    })
                }
            } while (m);

            return [...atts];
        });
    }, [dm.msg.content, dm.contentDirty]);

    useEffect(() => {
        let format: Intl.DateTimeFormatOptions = {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit"
        }
        setDateStr(dm.msg.date.toLocaleDateString(t("iso3166"), format));
    }, [dm.msg.date]);

    useEffect(() => {
        // TODO: handle multiple attachments
        /*
        let attachments: Array<DisplayedAttachment> = [];
        dm.msg.attachments.map(x => ctx.getCurrentInstance().getAttachmentOverNetwork(ctx.currServ!, ctx.currChannel!, dm.msg.id!, (b) => {
            attachments.push({
                url: null,
                blob: b
            })
        }));*/
        if (dm.msg.attachments.length > 0) {
            ctx.getCurrentInstance().getAttachmentOverNetworkAsync(ctx.currServ!, ctx.currChannel!, dm.msg.id!)
                .then((b) => {
                    if (b) {
                        setAttachments(atts => {
                            return [...atts.filter(x => x.source !== "attachment"), {
                                url: window.URL.createObjectURL(b),
                                mimetype: b.type,
                                source: "attachment"
                            }]
                        });
                    } else {
                        setAttachments(atts => {
                            return [...atts.filter(x => x.source !== "attachment")];
                        });
                    }
                });
        } else {
            setAttachments(atts => {
                return [...atts.filter(x => x.source !== "attachment")];
            });
        }
    }, [dm.msg.attachments]);

    let richDisplay: Array<React.ReactNode> = [];

    for (let a of attachments) {
        if (a.mimetype.startsWith("image/")) {
            richDisplay.push(<div>
                <img src={a.url}/>
            </div>)
        } else if (a.mimetype.startsWith("video/")) {
            richDisplay.push(<div>
                <video src={a.url}/>
            </div>)
        } else {
            let yt = a.url.match(/youtube\.com\/watch\?v=([0-9a-zA-Z_]+)/m);
            if (!yt) {
                yt = a.url.match(/youtu\.be\/([0-9a-zA-Z_]+)/m);
            }
            if (yt) {
                richDisplay.push(<div>
                    <iframe /*type="text/html"*/ width="512" height="256" src={`https://www.youtube-nocookie.com/embed/${yt[1]}`} frameBorder="0"></iframe>
                </div>);
            } else {
                console.warn(`Unknown mimetype ${a.mimetype}`);
            }
        }
    }

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
                <div className={"rich-preview is-flex" + (richDisplay.length > 0 ? "" : " is-hidden")}>
                    {richDisplay}
                </div>
                <div className={"attachment-info" + (dm.msg.attachments.length > 0 ? "" : " is-hidden")}>
                {dm.msg.attachments.length > 0 ? t("message.fileAttached", { "count": dm.msg.attachments.length.toString() }) : ""}
                </div>
            </div>
        </div>
    </div>
    )
});

export default MessageForm;