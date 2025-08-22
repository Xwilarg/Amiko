export default interface Message {
    id: number | null;
    date: Date;
    authors: number[] | null;
    content: string;
    attachments: string[];
    isError: boolean;

    ackId: number | null;
}