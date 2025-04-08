import Network from "../instance/network";

let sessions: Network[] = [];

// Current message ID
let currId = 1;

// Store when the last notification was received
// Used when notification settings is set on all messages, to not spam the user
let lastNotificationReceived: number | null = null;

export function session_addNetworkSession(n: Network) {
    sessions.push(n);
}

export function session_resetAllConnections() {
    for (let s of sessions) {
        s.resetConnection();
    }
}
