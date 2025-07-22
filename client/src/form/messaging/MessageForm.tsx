import { forwardRef } from "react"
import type Message from "../../model/Message";
import type { MessageFlag } from "../../model/MessageFlag";

interface MessageFormProps {
    msg: Message;
    type: MessageFlag
}

const MessageForm = forwardRef((
    { msg, type }: MessageFormProps,
    ref
) => {
    let _ = type; // tmp
    return (
    <div className="container message is-flex-grow-0">
        <div className="is-flex">
            <div className="pfp"></div>
            <div className="message-main">
                <small className="date"></small>
                <h2 className="subtitle"></h2>
                <p className="content">{msg.content}</p>
                <div className="rich-preview is-flex is-hidden"></div>
                <div className="attachment-info is-hidden"></div>
            </div>
        </div>
    </div>
    )
});

export default MessageForm;