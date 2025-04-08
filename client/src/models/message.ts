export default interface Message {
    date: Date;
    authors: number[];
    content: string;
    attachments: string[];

    ackId: number | null;
}