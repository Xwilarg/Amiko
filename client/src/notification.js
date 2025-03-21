let pendingNotifications = [];

// Add little red dot on top of parent for notification purpose
export function addNotificationDiv(parent, id)
{
    parent.classList.add("notif-container");

    const notif = document.createElement("span");
    notif.id = id;
    notif.classList.add("notif");
    notif.classList.add("is-hidden");
    parent.appendChild(notif);
}

export function addPendingNotification(servId, chanId) {
    console.log(`New notif in ${servId}/${chanId}`);
    if (!pendingNotifications.some(x => x.servId === servId && x.chanId === chanId))
    {
        pendingNotifications.push({ servId: servId, chanId: chanId });
        console.log(`Add notification in ${servId}/${chanId}`);

        document.getElementById("notif-global").classList.remove("is-hidden");
        document.getElementById(`notif-server-${servId}`).classList.remove("is-hidden");
        document.getElementById(`notif-channel-${servId}-${chanId}`)?.classList?.remove("is-hidden");
    }
}

export function removeNotification(servId, chanId) {
    pendingNotifications = pendingNotifications.filter(x => x.servId != servId || x.chanId != chanId);

    if (pendingNotifications.length === 0) document.getElementById("notif-global").classList.add("is-hidden");
    document.getElementById(`notif-server-${servId}`)?.classList?.add("is-hidden");
    document.getElementById(`notif-channel-${servId}-${chanId}`)?.classList?.add("is-hidden");

    updateNotifications();
}

function updateNotifications() {
    for (let n of pendingNotifications) {
        document.getElementById("notif-global").classList.remove("is-hidden");
        document.getElementById(`notif-server-${n.servId}`).classList.remove("is-hidden");
        document.getElementById(`notif-channel-${n.servId}-${n.chanId}`)?.classList?.remove("is-hidden");
    }
}