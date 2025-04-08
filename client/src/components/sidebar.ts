import { session_resetAllConnections } from "../network/sessionManager";

let areSettingsOpen = false;
const settings = [ "settings", "profile", "help", "debug" ];

function closeSettings() {
    for (const s of settings) {
        document.getElementById(`${s}-dropdown`)!.classList.add("is-hidden");
    }
    areSettingsOpen = false;
}

export async function sidebar_initAsync() {
    for (const s of settings) {
        document.getElementById(`toggle-${s}`)!.addEventListener("click", () => { // Click on a button to open the related menu
            const elem = document.getElementById(`${s}-dropdown`)!;
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
                const target = document.getElementById(`${s}-dropdown`)!;
                if (!target.classList.contains("is-hidden") && !document.querySelector(".navbar")!.contains(e.target as Node) && !target.contains(e.target as Node)) {
                    closeSettings();
                }
            }
        });
    }

     // @ts-ignore
    document.getElementById("version-electron")!.innerHTML = versions.electron();
     // @ts-ignore
    document.getElementById("version-node")!.innerHTML = versions.node();
     // @ts-ignore
    document.getElementById("version-browser")!.innerHTML = versions.chrome();
    document.getElementById("reset-conn")!.addEventListener("click", _ => {
        session_resetAllConnections();
    })
}