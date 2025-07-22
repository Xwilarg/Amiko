export default interface Message {
    id: number;
    date: Date;
    authors: number[] | null;
    content: string;
    attachments: string[];

    ackId: number | null;
}