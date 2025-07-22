import type NetworkSession from "../../instance/NetworkSession";
import MessageInputForm from "./MessageInputForm";

interface MessageContainerFormProps {
    session: NetworkSession;
}

export default function MessageContainerForm({ session }: MessageContainerFormProps) {
    return (
        <div id="main-screen">
            <div className="is-flex is-flex-direction-column" id="messages">
                Welcome to Amiko
            </div>
            <MessageInputForm session={session} />
        </div>
    )
}