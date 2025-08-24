import type Channel from "./Channel";
import type Color from "./Color";

export default interface Server {
    channels: { [id: number] : Channel; };
    name: string;

    color: Color;
    character: string;

    isEphemeral: boolean;
    allowsGuest: boolean;
}