import { forwardRef, useImperativeHandle, useState } from "react";
import MessageInputForm from "./MessageInputForm";
import type Message from "../../model/Message";
import MessageForm from "./MessageForm";

const MessageContainerForm = forwardRef((
    {},
    ref
) => {
    const [renderedMessages, setRendererMessages] = useState<Array<Message>>([]);
    
    useImperativeHandle(ref, () => ({
        sendMessage: (msg: Message) => {
            setRendererMessages([...renderedMessages, msg]);
        },
        clearAllMessages: () => {
            setRendererMessages([]);
        },
        setMessages: (msgs: Array<Message>) => {
            setRendererMessages(msgs);
        }
    }));
    return (
        <div id="main-screen">
            <div className="is-flex is-flex-direction-column" id="messages">
                {renderedMessages.map(msg => <MessageForm msg={msg} type="None"  key={msg.id ?? `ack-${msg.ackId}`} />)}
            </div>
            <MessageInputForm />
        </div>
    )
});

export default MessageContainerForm;