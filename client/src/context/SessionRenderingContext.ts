import EmojiConvertor from 'emoji-js';
import { marked } from "marked";
import NetworkSession from "../instance/NetworkSession";
import type { MessageFlag } from "../model/MessageFlag";
import type User from "../model/User";
import type Message from '../model/Message';
import type Server from '../model/Server';
import type { TFunction } from 'i18next';
import type Color from '../model/Color';
import { createContext } from 'react';

export default class SessionRenderingContext
{
    sessions: Array<NetworkSession>

    currInstance: number;
    currServ: number;
    currChannel: number;

    // Ref pointing to MessageContainerForm.tsx
    refMsg: React.RefObject<unknown> | null

    ackId: number;

    // Message parsing
    emojiParser: any;

    refreshGlobalState: (() => void) | null;
    refreshServerDisplayState: (() => void) | null;
    refreshNavbar: (() => void) | null;

    constructor() {
        this.refreshGlobalState = null;
        this.refreshServerDisplayState = null;
        this.refreshNavbar = null;

        this.emojiParser = new EmojiConvertor();
        this.emojiParser.replace_mode = "unified";

        // Override function
        const walkTokens = (token: any) => {/* TODO: bold reading
            // Bold reading check, emphasis the start of each word by putting it in bold
            if ((token.type === "text" || token.type === "paragraph")
                && preferences_getAccessibilityReadingMode() === ReadingMode.BoldReading
                && token.tokens
                && !token.raw.includes('<span class="link">') // Placeholder, TODO: redo link parsing in marked itself
            )
            {
                const finalTokens: Array<any> = [];

                token.tokens.forEach((subToken: any) => { // Paragraphs may contains lot to tokens
                    if (subToken.type === 'text') // We don't emphasis something that is already in italic or other
                    {
                        const words = subToken.text.split(' ');
                        for (let i = 0; i < words.length; i++) // We split by space so we can iterate on each word
                        {
                            const word = words[i] + ' ';
                            if (word.length < 3)
                            {
                                finalTokens.push({
                                    type: 'strong',
                                    tokens: [{ type: 'text', text: word }]
                                });
                            }
                            else
                            {
                                const first = word.substring(0, 3);
                                const rest = word.substring(3);

                                if (first) {
                                    finalTokens.push({
                                        type: 'strong',
                                        tokens: [{ type: 'text', text: first }]
                                    });
                                }
                                if (rest) {
                                    finalTokens.push({ type: 'text', text: rest });
                                }
                            }
                        }
                    } else {
                        finalTokens.push(subToken);
                    }
                });

                token.tokens = finalTokens;*/
            }

        marked.use({
            walkTokens,
            breaks: true,
            tokenizer: {
                // @ts-ignore
                link() {},
                // @ts-ignore
                url() {}
            }
        });

        this.sessions = [];

        this.currInstance = 0;
        this.currServ = 0;
        this.currChannel = 0;

        this.ackId = 0;

        this.refMsg = null;
    }

    /* MESSAGE PARSING */

    // Parse emojis such as :eyes:
    parseEmojis(str: string): string {
        return this.emojiParser.replace_colons(str);
    }

    // Parse markdown like *this* or # that
    parseMarkdown(str: string): string {
        // @ts-ignore
        return marked.parse(str);
    }

    /* USER MANAGEMENT */

    // Does current user have admin perms
    amIAdmin() : boolean {
        if (this.sessions.length === 0) return false;
        const m = this.sessions[this.currInstance].messaging;
        if (!m.mainUser) return false;
        return m.users[m.mainUser].isAdmin
    }

    getUsers(ids: Array<number>) : Array<User> {
        const users = this.sessions[this.currInstance].messaging.users
        return ids.map(x => users[x]);
    }

    addInstance(instance: string, token: string, t: TFunction<"translation", undefined>) {
        this.sessions.push(new NetworkSession(instance, token, this, t));
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

    /* MESSAGE MANAGEMENT */
    
    sendMessage(msg: Message, type: MessageFlag) {
        // @ts-ignore
        this.refMsg.current.sendMessage(msg, type);
    }

    sendUserMessage(text: string, authors: number[] | null) {
        const newMsg = {
            type: 2,
            content: text,
            ackId: this.ackId++,
            serverId: this.currServ,
            channelId: this.currChannel,
            authors: authors // TODO
        }

        this.sessions[this.currInstance].sendNetworkMessage(newMsg);
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

    /* NAVBAR */

    getInvitationLink(onSuccess: (invite: string) => void) {
        this.sessions[this.currInstance].getInvitationLink(onSuccess);
    }

    getCurrentInstance() : string {
        return this.sessions[this.currInstance].instance;
    }

    getCurrentServer() : Server {
        return this.sessions[this.currInstance].messaging.servers[this.currServ];
    }

    getCurrentChannelName() : string {
        return this.getCurrentServer().channels[this.currChannel].name;
    }

    getCurrentAuthors() : number[] {
        let curr = this.sessions[this.currInstance].messaging.mainUser;
        if (curr) return [ curr ];
        return [];
    }

    /* SETTINGS */
    updateServerInfo(name: string, color: Color, character: string, allowsGuest: boolean, isEphemeral: boolean) {
        return this.sessions[this.currInstance].sendNetworkMessage({
            type: 8,
            id: this.currServ,
            color: color,
            character: character,
            name: name,
            allowsGuest: allowsGuest,
            isEphemeral: isEphemeral
        });
    }
}

export const SessionRenderingContextProvider = createContext<SessionRenderingContext>(new SessionRenderingContext());