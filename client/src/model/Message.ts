export default interface Message {
    id: number | null;
    date: Date;
    authors: number[] | null;
    content: string;
    attachments: string[];

    ackId: number | null;
}