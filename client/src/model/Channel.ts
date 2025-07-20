import type Message from "./message";

export default interface Channel {
    name: string;
    description?: string;
    messages: Message[];
}