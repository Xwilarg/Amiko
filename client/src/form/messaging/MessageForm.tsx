import { forwardRef, useContext, type ReactElement } from "react"
import type Message from "../../model/Message";
import type { MessageFlag } from "../../model/MessageFlag";
import { SessionRenderingContextProvider } from "./AppForm";
import type Color from "../../model/Color";

interface MessageFormProps {
    msg: Message;
    type: MessageFlag
}

const MessageForm = forwardRef((
    { msg, type }: MessageFormProps,
    ref
) => {
    let ctx = useContext(SessionRenderingContextProvider);
    let users = msg.authors ? ctx.getUsers(msg.authors!) : []

    let cssTag = "";
    if (msg.ackId !== null) cssTag = "sending";
    else if (type === "IsSystem") cssTag = "system";
    else if (type == "IsError") cssTag = "error";

    let pfpNode: ReactElement;

    if (msg.authors !== null) {
        let pfp: string;
        let color: Color;
        // Update profile picture
        // Update character inside the PFP
        if (users.length === 0) { // Guest mode
            pfp = "G";
            color = { r: 53, g: 53, b: 53 };
        }
        else if (users.length === 1) { // Only one user, just need to take the current one!
            const u = users[0];
            pfp = u.character;
            color = { r: u.color.r, g: u.color.g, b: u.color.b };
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
            pfp = String.fromCodePoint(...arr);

            // Merge all users colors by doing their average
            color = {
                r: users.map(x => x.color.r).reduce((a, b) => a + b, 0) / users.length,
                g: users.map(x => x.color.g).reduce((a, b) => a + b, 0) / users.length,
                b: users.map(x => x.color.b).reduce((a, b) => a + b, 0) / users.length
            }
        }
        pfpNode =
        <div className="pfp" style={{
            background: `rgb(${color.r}, ${color.g}, ${color.b})`
        }}>{pfp}</div>;
    }
    else
    {
        pfpNode = <div className="pfp"></div>
    }

    return (
    <div className={`container message is-flex-grow-0 ${cssTag}`}>
        <div className="is-flex">
            {pfpNode}
            <div className="message-main">
                <small className="date">{msg.date.toDateString()}</small>
                <h2 className="subtitle">{users.map(x => x.username).join(", ")}</h2>
                <p className="content">{msg.content}</p>
                <div className="rich-preview is-flex is-hidden"></div>
                <div className="attachment-info is-hidden"></div>
            </div>
        </div>
    </div>
    )
});

export default MessageForm;