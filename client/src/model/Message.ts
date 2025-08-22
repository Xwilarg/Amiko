import type { MessageFlag } from "./MessageFlag";

export default interface Message {
    id: number | null;
    date: Date;
    authors: number[] | null;
    content: string;
    attachments: string[];
    flag: MessageFlag;

    ackId: number | null;
}