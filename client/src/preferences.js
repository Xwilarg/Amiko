function updateStyle(newVal) {
    document.getElementById("user-style").setAttribute("href", `./css/options/${newVal}.css`);
}

export async function initPreferencesAsync() {
    // Style selection (which CSS we use)
    document.getElementById("style-selection-select").addEventListener("change", async e => {
        const newVal = e.target.value;
        updateStyle(newVal);
        await filesystem.writePrefAsync("style", newVal);
    });
    const style = await filesystem.readPrefAsync("style", "regular");
    document.getElementById("style-selection-select").value = style;
    updateStyle(style);

    // Current user
    var cU = await filesystem.readPrefArrayAsync("users");
    currentUser = cU.map(x => parseInt(x));

    // How we do user selection
    currentSelectionMode = parseInt(await filesystem.readPrefAsync("userSelection", USER_SELECTION_SINGLE));
    document.getElementById("user-type-selection-select").value = currentSelectionMode.toString();
}

let currentUser = null;
let currentSelectionMode;

export async function setSelectionModeAsync(value)
{
    await filesystem.writePrefAsync("userSelection", value);
    currentSelectionMode = value;
}

export function getSelectionMode()
{
    return currentSelectionMode;
}

export async function setCurrentAltUserAsync(value)
{
    await filesystem.writePrefArrayAsync("users", value);
    currentUser = value;
}

export function getCurrentAltUser()
{
    return currentUser;
}

// User selection mode
export const USER_SELECTION_SINGLE = 0;
export const USER_SELECTION_MULTIPLE = 1;