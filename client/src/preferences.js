function updateStyle(newVal) {
    document.getElementById("user-style").setAttribute("href", `./css/options/${newVal}.css`);
}

export async function initPreferencesAsync() {
    document.getElementById("style-selection-select").addEventListener("change", async e => {
        const newVal = e.target.value;
        updateStyle(newVal);
        await filesystem.writePrefAsync("style", newVal);
    });
    const style = await filesystem.readPrefAsync("style", "regular");
    document.getElementById("style-selection-select").value = style;
    updateStyle(style);

    var cU = await filesystem.readPrefAsync("user", null);
    currentUser = cU ? parseInt(cU) : null;
}

let currentUser = null;
export async function setCurrentAltUser(value)
{
    await filesystem.writePrefAsync("user", value);
    currentUser = value;
}

export function getCurrentAltUser()
{
    return currentUser;
}