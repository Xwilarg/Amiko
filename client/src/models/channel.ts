import Message from "./message";

export default interface Channel {
    name: string;
    messages: Message[];
}