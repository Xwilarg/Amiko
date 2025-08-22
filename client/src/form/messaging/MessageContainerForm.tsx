import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import MessageInputForm from "./MessageInputForm";
import MessageForm from "./MessageForm";
import type Message from "../../model/Message";

const MessageContainerForm = forwardRef((
    {},
    msgRef
) => {
    const [renderedMessages, setRendererMessages] = useState<Array<Message>>([]);

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
        sendMessage: (msg: Message) => {
            setRendererMessages(prev => [...prev, msg]);
        },
        clearAllMessages: () => {
            setRendererMessages([]);
        },
        setMessages: (msgs: Array<Message>) => {
            setRendererMessages(prev => [...prev, ...msgs]);
        },
        refresh:  () => {
            setRendererMessages(prev => [...prev]);
        },
        updateSingleMessage(id: number, p: Message) {
            setRendererMessages(msgs => {
                let msg = msgs.find(x => x.id === id)!;
                msg.ackId = null;
                msg.flag = p.flag ?? msg.flag;
                msg.attachments = p.attachments ?? msg.attachments;
                msg.content = p.content ?? msg.content;
                return [...msgs];
            });
        }
    }));
    return (
        <div id="main-screen">
            <div className="is-flex is-flex-direction-column" id="messages" ref={containerRef}>
                {renderedMessages.map(msg => <MessageForm msg={msg} />)}
                <div ref={messagesEndRef} />
            </div>
            <MessageInputForm />
        </div>
    )
});

export default MessageContainerForm;