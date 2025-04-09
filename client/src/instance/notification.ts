interface NotificationTarget
{
    serverId: number;
    channelId: number;
}

export default class Notification
{
    element: HTMLElement;
    channels: number[];

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
        if (!this.channels.includes(chanId)) {
            this.channels.push(chanId);
        }
        this.element.classList.remove("is-hidden");
    }

    removeNotification(chanId: number) {
        this.channels = this.channels.filter(x => x != chanId);
        if (this.channels.length == 0) {
            this.element.classList.add("is-hidden");
        }
    }
}