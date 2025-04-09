import Network from "../instance/network";

let sessions: Network[] = [];

// Store when the last notification was received
// Used when notification settings is set on all messages, to not spam the user
let lastNotificationReceived: number | null = null;

export function session_getLastNotificationReceived() : number | null { return lastNotificationReceived; }
export function session_setLastNotificationReceived(value: number) { lastNotificationReceived = value; }

export function session_addNetworkSession(n: Network) {
    sessions.push(n);
}

export function session_resetAllConnections() {
    for (let s of sessions) {
        s.resetConnection();
    }
}
