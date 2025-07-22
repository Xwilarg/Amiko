import { forwardRef, useImperativeHandle, useState } from "react";
import MessageInputForm from "./MessageInputForm";
import type Message from "../../model/Message";
import MessageForm from "./MessageForm";
import type { MessageFlag } from "../../model/MessageFlag";

interface ScreenMessage {
    msg: Message;
    flag: MessageFlag
}

const MessageContainerForm = forwardRef((
    {},
    ref
) => {
    const [renderedMessages, setRendererMessages] = useState<Array<ScreenMessage>>([]);
    
    useImperativeHandle(ref, () => ({
        sendMessage: (msg: Message, flag: MessageFlag) => {
            setRendererMessages([...renderedMessages, { msg: msg, flag: flag }]);
        },
        clearAllMessages: () => {
            setRendererMessages([]);
        },
        setMessages: (msgs: Array<Message>) => {
            const formatted = msgs.map<ScreenMessage>(x => { return { msg: x, flag: "None" }; })
            setRendererMessages([...renderedMessages, ...formatted]);
        }
    }));
    return (
        <div id="main-screen">
            <div className="is-flex is-flex-direction-column" id="messages">
                {renderedMessages.map(msg => <MessageForm msg={msg.msg} type={msg.flag} key={msg.msg.id ?? `ack-${msg.msg.ackId}`} />)}
            </div>
            <MessageInputForm />
        </div>
    )
});

export default MessageContainerForm;