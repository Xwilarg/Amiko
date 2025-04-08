import Channel from "./channel";

export default interface Server {
    channels: { [id: number] : Channel; };
    name: string;
}