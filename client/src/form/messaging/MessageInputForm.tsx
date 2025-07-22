import { forwardRef, useImperativeHandle, useState } from 'react'
import type NetworkSession from '../../instance/NetworkSession';

interface MessageInputFormProps {
    session: NetworkSession;
}

const MessageInputForm = forwardRef((
    { session }: MessageInputFormProps,
    ref
) => {
    const [message, setMessage] = useState('');

    useImperativeHandle(ref, () => ({
    }));

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
    }

    return (
    <form onSubmit={onSubmit}>
        <fieldset disabled={false} id="message-form" className="field has-addons container">
            <p className="control">
                <label htmlFor="attach-file" className="button" id="attach-file-container">
                    <span className="material-symbols-outlined">attach_file</span>
                    <input type="file" id="attach-file" />
                </label>
            </p>
            <p className="control is-expanded">
                <textarea maxLength={3000} className="textarea" placeholder="Your message" id="message-field" 
                    value={message} onChange={(e) => setMessage(e.target.value)}
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
});

export default MessageInputForm;