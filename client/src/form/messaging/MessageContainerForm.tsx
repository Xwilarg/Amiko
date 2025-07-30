import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import MessageInputForm from "./MessageInputForm";
import MessageForm from "./MessageForm";
import type { MessageFlag } from "../../model/MessageFlag";
import type Message from "../../model/Message";

interface ScreenMessage {
    msg: Message;
    flag: MessageFlag
}

const MessageContainerForm = forwardRef((
    {},
    msgRef
) => {
    const [renderedMessages, setRendererMessages] = useState<Array<ScreenMessage>>([]);

    // Add a div at the end of the list of message to easily scroll down
    // https://stackoverflow.com/a/52266212
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const containerRef = useRef<null | HTMLDivElement>(null);
    const container = containerRef.current;

    // Approximate distance with the bottom of the page
    let dist = 0;
    if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        dist = scrollHeight - scrollTop - clientHeight;
    }

    useEffect(() => {
        if (dist < 150) { // If user scrolled back up, we don't scroll down automatically
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [renderedMessages]);

    useImperativeHandle(msgRef, () => ({
        sendMessage: (msg: Message, flag: MessageFlag) => {
            setRendererMessages(prev => [...prev, { msg: msg, flag: flag }]);
        },
        clearAllMessages: () => {
            setRendererMessages([]);
        },
        setMessages: (msgs: Array<Message>) => {
            const formatted = msgs.map<ScreenMessage>(x => { return { msg: x, flag: "None" }; })
            setRendererMessages(prev => [...prev, ...formatted]);
        },
        refresh:  () => {
            setRendererMessages(prev => [...prev]);
        }
    }));
    return (
        <div id="main-screen">
            <div className="is-flex is-flex-direction-column" id="messages" ref={containerRef}>
                {renderedMessages.map(msg => <MessageForm msg={msg.msg} type={msg.flag} key={msg.msg.id ?? `ack-${msg.msg.ackId}`} />)}
                <div ref={messagesEndRef} />
            </div>
            <MessageInputForm />
        </div>
    )
});

export default MessageContainerForm;