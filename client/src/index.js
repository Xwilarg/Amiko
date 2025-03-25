import { createHttpUrl, openMessageConnection } from "./network";
import { initPreferencesAsync } from "./preferences";
import { initRenderer } from "./renderer";
import { initUsersAsync } from "./user";

let token;
let areSettingsOpen = false;

const settings = [ "home", "settings", "profile", "help" ];

window.addEventListener('DOMContentLoaded', async () => {
    const pwd = document.getElementById("password");
    const fileToken = await filesystem.readTokenAsync();

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

    document.getElementById("password-submit").addEventListener("click", e => {
        e.preventDefault();
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
            await filesystem.writeTokenAsync(token);
            pwd.value = "";
            document.getElementById("login-popup").classList.remove("is-active");
            openMessageConnection(token);
        })
        .catch((err) => {
            alert(`Login failed: ${err}`)
        });
    });

    for (const s of settings) {
        document.getElementById(`toggle-${s}`).addEventListener("click", () => { // Click on a button to open the related menu
            const elem = document.getElementById(`${s}-dropdown`);
            if (elem.classList.contains("is-hidden")) {
                closeSettings();
                elem.classList.remove("is-hidden");
                areSettingsOpen = true;
            }
            else
            {
                elem.classList.add("is-hidden");
                areSettingsOpen = false;
            }
        });
        window.addEventListener("click", (e) => { // Click outside of the menu area to close it
            if (areSettingsOpen) {
                const target = document.getElementById(`${s}-dropdown`);
                if (!target.classList.contains("is-hidden") && !document.querySelector(".navbar").contains(e.target) && !target.contains(e.target)) {
                    closeSettings();
                }
            }
        });
    }

    await initPreferencesAsync(); // Need to be called first since the rest might depends of user preferences
    initRenderer();
    await initUsersAsync();
});

export function closeSettings() {
    for (const s of settings) {
        document.getElementById(`${s}-dropdown`).classList.add("is-hidden");
    }
    areSettingsOpen = false;
}