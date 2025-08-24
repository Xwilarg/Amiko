import type Message from "./Message";

export default interface Channel {
    name: string;
    description?: string;
    messages: Message[];

    hasPendingNotification: boolean;
}