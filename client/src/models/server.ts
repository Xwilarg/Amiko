import Notification from "../instance/notification";
import Channel from "./channel";

export default interface Server {
    channels: { [id: number] : Channel; };
    name: string;

    isEphemeral: boolean;
    allowGuest: boolean;

    element: HTMLButtonElement;
    notification: Notification;
}