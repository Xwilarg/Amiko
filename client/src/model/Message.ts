export default interface Message {
    id: number;
    date: Date;
    authors: number[];
    content: string;
    attachments: string[];

    ackId: number | null;
}