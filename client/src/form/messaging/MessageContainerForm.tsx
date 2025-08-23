import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import MessageInputForm from "./MessageInputForm";
import MessageForm from "./MessageForm";
import type Message from "../../model/Message";

export interface DisplayedMessage
{
    msg: Message
    authorDirty: number,
    contentDirty: number
}

const MessageContainerForm = forwardRef((
    {},
    msgRef
) => {
    const [renderedMessages, setRendererMessages] = useState<Array<DisplayedMessage>>([]);

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
            setRendererMessages(prev => [...prev, { msg: msg, authorDirty: 0, contentDirty: 0 }]);
        },
        clearAllMessages: () => {
            setRendererMessages([]);
        },
        setMessages: (msgs: Array<Message>) => {
            setRendererMessages(prev => [...prev, ...msgs.map(x => { return { msg: x, authorDirty: 0, contentDirty: 0 }})]);
        },
        refreshAuthors:  () => {
            setRendererMessages(prev => [...prev.map(x => {
                x.authorDirty++;
                return x;
            })]);
        },
        refreshContent:  () => {
            setRendererMessages(prev => [...prev.map(x => {
                x.contentDirty++;
                return x;
            })]);
            setRendererMessages(prev => [...prev]);
        },
        updateSingleMessage(id: number, p: Message) {
            setRendererMessages(msgs => {
                let dm = msgs.find(x => x.msg.id === id)!;
                dm.msg.ackId = null;
                dm.msg.flag = p.flag ?? dm.msg.flag;
                dm.msg.attachments = p.attachments ?? dm.msg.attachments;
                dm.msg.content = p.content ?? dm.msg.content;
                return [...msgs];
            });
        }
    }));
    return (
        <div id="main-screen">
            <div className="is-flex is-flex-direction-column" id="messages" ref={containerRef}>
                {renderedMessages.map(msg => <MessageForm dm={msg} />)}
                <div ref={messagesEndRef} />
            </div>
            <MessageInputForm />
        </div>
    )
});

export default MessageContainerForm;