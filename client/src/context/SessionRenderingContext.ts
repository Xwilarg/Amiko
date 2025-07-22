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

    constructor() {
        this.sessions = [];

        this.currInstance = 0;
        this.currServ = 0;
        this.currChannel = 0;

        this.refMsg = null;
    }

    addInstance(instance: string, token: string, refreshState: () => void) {
        this.sessions.push(new NetworkSession(instance, token, this, refreshState));
    }

    isCurrentServer(s: NetworkSession, servId: number) {
        return s.instance == this.sessions[this.currInstance].instance &&
            this.currServ == servId;
    }

    isCurrentChannel(s: NetworkSession, servId: number, chanId: number) {
        return this.isCurrentServer(s, servId) &&
            this.currChannel == chanId;
    }
    
    sendMessage(msg: Message, type: MessageFlag) {
        // @ts-ignore
        this.refMsg.current.sendMessage(msg);
    }
    
    clearAllMessages() {
    
    }
    
    setMessages(msgs: Message[]) {
    
    }
}