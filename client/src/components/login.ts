import Network from "../models/network";
import { session_addNetworkSession } from "../models/session";

export async function login_initAsync() {
    const websiteElem = (document.getElementById("website")! as HTMLInputElement);
    websiteElem.value = location.host;

    document.getElementById("password-submit")!.addEventListener("click", e => {
        e.preventDefault();

        const pwdElem = (document.getElementById("password")! as HTMLInputElement);

        if (!pwdElem) return;

        const instance = new Network(websiteElem.value, true);
        instance.loginWithPassword(pwdElem.value, () => {
            document.getElementById("login-popup")!.classList.remove("is-active");
            session_addNetworkSession(instance);
        });

        pwdElem.value = "";
    });

    // @ts-ignore
    filesystem.readTokenAsync(this.token, this.website).then((tokens: {[id: string]: string}) => {
        for (const [key, value] of Object.entries(tokens)) {
            const instance = new Network(key, true);
            instance.loginWithToken(value, () => {
                document.getElementById("login-popup")!.classList.remove("is-active");
                session_addNetworkSession(instance);
            });
        }
    });

    document.getElementById("close-login")!.addEventListener("click", _ => {
        document.getElementById("login-popup")!.classList.remove("is-active");
    });
}