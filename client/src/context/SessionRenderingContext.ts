import NetworkSession from "../instance/NetworkSession";
import type Message from "../model/Message";
import type { MessageFlag } from "../model/MessageFlag";

export default class SessionRenderingContext
{
    sessions: Array<NetworkSession>

    currInstance: number;
    currServ: number;
    currChannel: number;

    refMsg: React.RefObject<unknown> | null

    ackId: number;

    constructor() {
        this.sessions = [];

        this.currInstance = 0;
        this.currServ = 0;
        this.currChannel = 0;

        this.ackId = 0;

        this.refMsg = null;
    }

    addInstance(instance: string, token: string, refreshState: () => void) {
        this.sessions.push(new NetworkSession(instance, token, this, refreshState));
    }

    isCurrentInstance(s: NetworkSession) {
        return s.instance == this.sessions[this.currInstance].instance;
    }

    isCurrentServer(s: NetworkSession, servId: number) {
        return this.isCurrentInstance(s) && this.currServ == servId;
    }

    isCurrentChannel(s: NetworkSession, servId: number, chanId: number) {
        return this.isCurrentServer(s, servId) &&
            this.currChannel == chanId;
    }
    
    sendMessage(msg: Message, type: MessageFlag) {
        // @ts-ignore
        this.refMsg.current.sendMessage(msg);
    }

    sendUserMessage(text: string) {
        const newMsg = {
            type: 2,
            content: text,
            ackId: this.ackId++,
            serverId: this.currServ,
            channelId: this.currChannel,
            authors: [] // TODO
        }

        this.sessions[this.currInstance].sendMessage(newMsg);
        const msg = this.sessions[this.currInstance].messaging.addPendingMessage(this.currServ, this.currChannel, newMsg)
        this.sendMessage(msg, "None")
    }
    
    clearAllMessages() {
        // @ts-ignore
        this.refMsg.current.clearAllMessages();
    }
    
    setMessages(msgs: Message[]) {
        // @ts-ignore
        this.refMsg.current.setMessages(msgs);
    }
}