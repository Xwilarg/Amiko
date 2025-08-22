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
import type Channel from '../model/Channel';

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

    displayMode: DisplayMode;
    isBoldReading: boolean;

    refreshServerDisplayState: (() => void) | null;
    refreshNavbar: (() => void) | null;
    refreshServerSettings: (() => void) | null;

    constructor() {
        this.refreshServerDisplayState = null;
        this.refreshNavbar = null;
        this.refreshServerSettings = null;

        this.emojiParser = new EmojiConvertor();
        this.emojiParser.replace_mode = "unified";

        this.displayMode = "Default";
        this.isBoldReading = false;
        this.initPreferencesAsync();

        // Override function
        const walkTokens = (token: any) => {
            // Bold reading check, emphasis the start of each word by putting it in bold
            if ((token.type === "text" || token.type === "paragraph")
                && this.getBoldReading()
                && token.tokens
                && !token.raw.includes('<span class="link">') // Placeholder, TODO: redo link parsing in marked itself
            )
            {
                const finalTokens: Array<any> = [];

                for (let i = 0; i < token.tokens.length; i++) {
                    let subToken = token.tokens[i];
                    if (i > 0 && subToken.type === "text" && token.tokens[i - 1].type === "html" && token.tokens[i - 1].text.includes("material-symbols-outlined"))
                    {
                        finalTokens.push(subToken);
                    }
                    else if (subToken.type === 'text') // We don't emphasis something that is already in italic or other
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
                }

                token.tokens = finalTokens;
            }
        };

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
        return marked.parse(str) as string;
    }

    sendWarning(text: string) {
        this.sessions[this.currInstance].messaging.sendSystemMessage(text);
    }

    sendError(text: string) {
        this.sessions[this.currInstance].messaging.sendErrorMessage(text);
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
        const s = this.sessions.find(x => x.instance === instance);
        if (!s) {
            this.sessions.push(new NetworkSession(instance, token, this, t));
        }
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

    setCurrentServer(servId: number) {
        this.currServ = servId;
        this.refreshServerDisplayState!();
        this.refreshServerSettings?.();
        this.replaceMessages()
    }

    setCurrentChannel(chanId: number) {
        this.currChannel = chanId;
        this.refreshServerDisplayState!();
        this.replaceMessages()
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
    
    // Remove all messages sent and replace by the current ones
    replaceMessages() {
        // @ts-ignore
        this.refMsg.current.clearAllMessages();
        // @ts-ignore
        this.refMsg.current.setMessages(this.getCurrentChannel().messages);
    }

    // Add the list of message given in param to the screen
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

    getCurrentChannel() : Channel {
        return this.getCurrentServer().channels[this.currChannel];
    }

    getCurrentChannelName() : string {
        return this.getCurrentServer().channels[this.currChannel].name;
    }

    getCurrentAuthors() : number[] {
        let curr = this.sessions[this.currInstance].messaging.mainUser;
        if (curr) return [ curr ];
        return [];
    }

    getCurrentClaimUser(): User {
        let m = this.sessions[this.currInstance].messaging;
        return m.users[m.mainUser!];
    }

    isCurrentUserGuest(): boolean {
        return this.sessions[this.currInstance].messaging.mainUser === null;
    }

    /* SETTINGS */
    updateServerInfo(name: string, color: Color, character: string, allowsGuest: boolean, isEphemeral: boolean) {
        this.sessions[this.currInstance].sendApiMessage({
            color: color,
            character: character,
            name: name,
            allowsGuest: allowsGuest,
            isEphemeral: isEphemeral
        }, `server/update/${this.currServ}`, "POST");
    }

    updateUserInfo(username: string, color: Color, character: string) { // TODO: handle alters
        this.sessions[this.currInstance].sendApiMessage({
            type: 5,
            color: color,
            character: character,
            username: username
        }, `user/update/${this.sessions[this.currInstance].messaging.mainUser}`, "POST");
    }

    createNewServer() {
        this.sessions[this.currInstance].sendApiMessageNoPayload(`server/create`, "POST");
    }

    deleteServer() {
        this.sessions[this.currInstance].sendApiMessageNoPayload(`server/delete/${this.currServ}`, "DELETE");
    }

    createNewChannel() {
        this.sessions[this.currInstance].sendApiMessageNoPayload(`channel/create/${this.currServ}`, "POST");
    }

    updateChannelName(chanId: number, name: string) {
        this.sessions[this.currInstance].sendApiMessage({
            name: name
        }, `channel/update/${this.currServ}/${chanId}`, "POST");
    }

    deleteChannel(chanId: number) {
        this.sessions[this.currInstance].sendApiMessageNoPayload(`channel/delete/${this.currServ}/${chanId}`, "DELETE");
    }

    downloadExport() {
        fetch(`${this.getCurrentInstance()}/api/export/${this.currServ}/${this.currChannel}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.sessions[this.currInstance].token}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(text => {
            var e = document.createElement('a');
            // https://stackoverflow.com/questions/65050679/javascript-a-simple-way-to-save-a-text-file/73775602#73775602
            e.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            e.setAttribute('download', `export-${this.getCurrentChannelName()}-${new Date().toDateString()}.md`);
            e.style.display = 'none';
            document.body.appendChild(e);
            e.click();
            document.body.removeChild(e);
        })
        .catch((err) => { this.sendError(`Export failed: ${err}`); });
    }

    /* User preferences */
    async initPreferencesAsync() {
        // @ts-ignore
        this.displayMode = await filesystem.readPrefAsync("displayMode", "Default");
        // @ts-ignore
        this.isBoldReading = await filesystem.readPrefAsync("boldReading", "0") === "1";
    }

    getDisplayMode(): DisplayMode {
        return this.displayMode;
    }

    async setDisplayModeAsync(mode: DisplayMode) {
        // @ts-ignore
        await filesystem.writePrefAsync("displayMode", mode);
        this.displayMode = mode;
    }

    getBoldReading(): boolean {
        return this.isBoldReading;
    }

    async setBoldReadingAsync(value: boolean) {
        // @ts-ignore
        await filesystem.writePrefAsync("boldReading", value ? "1" : "0");
        this.isBoldReading = value;
    }
}

export const SessionRenderingContextProvider = createContext<SessionRenderingContext>(new SessionRenderingContext());

export type DisplayMode = 'Default' | 'Minimalist';