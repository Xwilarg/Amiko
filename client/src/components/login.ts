import Network from "../instance/network";
import { session_addNetworkSession, session_hasNetworkSession } from "../network/sessionManager";

export async function login_initAsync() {
    const websiteElem = (document.getElementById("website")! as HTMLInputElement);

    // @ts-ignore
    const defaultUrl: string = configuration.baseUrl();
    if (defaultUrl !== null) {
        websiteElem.value = defaultUrl;
        websiteElem.readOnly = true;
    }

    document.getElementById("login-guest")!.addEventListener("click", e => {
        e.preventDefault();

        const instance = new Network(websiteElem.value, true);
        instance.loginAsGuest();
        document.getElementById("login-popup")!.classList.remove("is-active");
        session_addNetworkSession(instance);
    });

    document.getElementById("password-submit")!.addEventListener("click", e => {
        e.preventDefault();

        const pwdElem = (document.getElementById("password")! as HTMLInputElement);

        if (!pwdElem || !websiteElem) return;

        if (websiteElem.value.startsWith("https://")) { // We don't store that
            websiteElem.value = websiteElem.value.substring(8);
        }
        if (websiteElem.value.endsWith("/")) {
            websiteElem.value = websiteElem.value.substring(0, websiteElem.value.length - 1);
        }

        if (session_hasNetworkSession(websiteElem.value)) {
            alert("There is already a connected session to this instance");
            return;
        }

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

    const addInstance = document.getElementById("add-instance") as HTMLButtonElement;
    // @ts-ignore
    if (compatibility.crossorigin()) {
        addInstance.addEventListener("click", _ => {
            document.getElementById("close-login")!.classList.remove("is-hidden");
            websiteElem.value = "";

            document.getElementById("login-popup")!.classList.add("is-active");
        });
    } else {
        addInstance.disabled = true;
    }
}