import { useContext, useState } from 'react'
import { SessionRenderingContextProvider } from '../../context/SessionRenderingContext';


export default function MessageInputForm() {
    const [message, setMessage] = useState('');
    const [r, forceRefresh] = useState(0);
    const ctx = useContext(SessionRenderingContextProvider);

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    ctx.refreshMessageInput = refreshPage;

    function sendMessage() {
        if (message || ctx.getCurrentInstance().messaging.hasAttachment()) {
            let ackId = ctx.sendUserMessage(message, ctx.getCurrentAuthors());
            if (ackId === null) return; // Message couldn't be sent

            setMessage("");

            if (ctx.getCurrentInstance().messaging.hasAttachment()) {
                ctx.getCurrentInstance().messaging.addAttachmentToMessage(ackId, ctx.currServ!, ctx.currChannel!);
                ctx.getCurrentInstance().messaging.setAttachment(null);
            }
        }
    }

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        sendMessage();
    }

    function onKeyPressed(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            ctx.getCurrentInstance().messaging.setAttachment(null);
        }
    }

    function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
        for (var item of e.clipboardData.items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (!file) continue;

                if (file.size > 2000000) {
                    ctx.getCurrentInstance().messaging.setAttachment(null);
                    alert("File must be smaller than 2MB");
                } else {
                    // @ts-ignore
                    ctx.getCurrentInstance().messaging.setAttachment([ file ]);
                }
                break;
            }
        }
    }

    return (
    <form onSubmit={onSubmit}>
        <fieldset disabled={false} id="message-form" className="field has-addons container">
            <p className="control">
                <label htmlFor="attach-file" className={"button" + ((ctx.getCurrentInstance()?.messaging?.hasAttachment() ?? false) ? " is-primary" : "")} id="attach-file-container">
                    <span className="material-symbols-outlined">attach_file</span>
                    <input type="file" id="attach-file" onChange={(e) => {
                        ctx.getCurrentInstance().messaging.setAttachment(e.target.files);
                    }} />
                </label>
            </p>
            <p className="control is-expanded">
                <textarea maxLength={3000} className="textarea" placeholder="Your message" id="message-field" 
                    value={message} onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={onKeyPressed} onPaste={onPaste}
                ></textarea>
            </p>
            <p className="control">
                <button className="button is-link" type="submit" id="send-message">
                    <span className="material-symbols-outlined">send</span>
                </button>
            </p>
        </fieldset>

    </form>
    )
}