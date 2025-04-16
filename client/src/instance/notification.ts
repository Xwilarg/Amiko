import { session_updateNotificationCount } from "../network/sessionManager";

export default class Notification
{
    element: HTMLElement;
    // Associate channel id and amount of new messages
    channels: { [id: number] : number; };

    constructor(container: HTMLElement, showNotificationByDefault: boolean) {
        this.element = this.addNotificationDiv(container, showNotificationByDefault);
        this.channels = [];
    }

    addNotificationDiv(parent: HTMLElement, show: boolean): HTMLElement
    {
        parent.classList.add("notif-container");

        const notif = document.createElement("span");
        notif.classList.add("notif");
        if (!show) notif.classList.add("is-hidden");
        parent.appendChild(notif);

        return parent.lastElementChild as HTMLElement;
    }

    addNotification(chanId: number) {
        if (!(chanId in this.channels)) {
            this.channels[chanId] = 1;
        } else {
            this.channels[chanId]++;
        }
        this.element.classList.remove("is-hidden");

        session_updateNotificationCount();
    }

    removeNotification(chanId: number) {
        delete this.channels[chanId];
        if (Object.keys(this.channels).length == 0) {
            this.element.classList.add("is-hidden");
        }

        session_updateNotificationCount();
    }

    getNotificationCount(): number {
        return Object.values(this.channels).reduce((a, b) => a + b, 0);
    }
}