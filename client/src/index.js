import { initLoginAsync } from "./login";
import { closeConnection } from "./network";
import { initPreferencesAsync } from "./preferences";
import { initRenderer } from "./renderer";
import { initUsersAsync } from "./user";

let token;
let areSettingsOpen = false;

const settings = [ "settings", "profile", "help", "debug" ];

window.addEventListener('DOMContentLoaded', async () => {

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

    document.getElementById("version-electron").innerHTML = versions.electron();
    document.getElementById("version-node").innerHTML = versions.node();
    document.getElementById("version-browser").innerHTML = versions.chrome();
    document.getElementById("reset-conn").addEventListener("click", _ => {
        closeConnection();
    })

    await initLoginAsync();
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