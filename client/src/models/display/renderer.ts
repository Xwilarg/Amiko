import Network from "../network";
import MessageInstance from "./messageInstance";

export default class Renderer {
    network: Network;

    constructor(network: Network) {
        this.network = network;
    }

    sendSystemMessage(text) {
        // TODO
    }

    sendErrorMessage(text) {
        // TODO
    }

    clearAll() {

    }

    sendMessageInternal(date: Date) {
        const container = document.getElementById("messages");

        new MessageInstance(container);
    }
}