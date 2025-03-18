import { createHttpUrl, openMessageConnection } from "./network";
import { initRenderer } from "./renderer";

let token;

window.addEventListener('DOMContentLoaded', async () => {
    const pwd = document.getElementById("password");
    const fileToken = await filesystem.readAsync();

    if (fileToken) {
        fetch(createHttpUrl("auth/validate"), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${fileToken}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(_ => {
            token = fileToken;
            pwd.value = "";
            document.getElementById("login-popup").classList.remove("is-active");
            openMessageConnection(token);
        })
        .catch((err) => { console.error(err); });
    }

    document.getElementById("password-submit").addEventListener("click", _ => {
        fetch(createHttpUrl("auth/token"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pwd.value)
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(async text => {
            token = text;
            await filesystem.writeAsync(token);
            pwd.value = "";
            document.getElementById("login-popup").classList.remove("is-active");
            openMessageConnection(token);
        })
        .catch((err) => {
            alert(`Login failed: ${err}`)
        });
    });

    document.getElementById("toggle-home").addEventListener("click", () => {
        const elem = document.getElementById("home-dropdown");
        if (elem.classList.contains("is-hidden")) {
            closeSettings();
            elem.classList.remove("is-hidden");
        }
        else elem.classList.add("is-hidden");
    });
    document.getElementById("toggle-settings").addEventListener("click", () => {
        const elem = document.getElementById("settings-dropdown");
        if (elem.classList.contains("is-hidden")) {
            closeSettings();
            elem.classList.remove("is-hidden");
        }
        else elem.classList.add("is-hidden");
    });

    document.getElementById("style-selection").addEventListener("change", e => {
        const newVal = e.target.value;
        document.getElementById("user-style").setAttribute("href", `./css/options/${newVal}.css`);
    });

    initRenderer();
});

export function closeSettings() {
    document.getElementById("home-dropdown").classList.add("is-hidden");
    document.getElementById("settings-dropdown").classList.add("is-hidden");
}