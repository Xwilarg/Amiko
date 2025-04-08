import Network from "./network";

let sessions: Network[] = [];

export function session_addNetworkSession(n: Network) {
    sessions.push(n);
}

export function session_resetAllConnections() {
    for (let s of sessions) {
        s.resetConnection();
    }
}