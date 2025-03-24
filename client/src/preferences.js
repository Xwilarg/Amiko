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
    currentUser = cU.map(parseInt);

    // How we do user selection
    currentSelectionMode = parseInt(await filesystem.readPrefAsync("userSelection", USER_SELECTION_SINGLE));
    document.getElementById("user-type-selection-select").addEventListener("change", async e => {
        console.log("select change was triggered");
        setSelectionMode(parseInt(e.target.value));

        if (parseInt(e.target.value) === USER_SELECTION_SINGLE)
        {
            if (currentUser.length > 0) // If we are at null we don't care cause we keep our default user
            {
                setCurrentAltUser(currentUser[0]);
            }
            for (let p of document.getElementsByClassName("profile"))
            {
                if (currentUser.length === 0 && p.dataset.me === "1") {
                    // No user specified, we take the "main" account
                    p.disabled = true;
                    p.classList.add("selected");
                } else if (currentUser.length > 0 && p.dataset.id === currentUser[0].toString()) {
                    // This user is the one currently selected
                    p.disabled = true;
                    p.classList.add("selected");
                } else {
                    p.disabled = false;
                    p.classList.remove("selected");
                }
            }
        }
        else if (parseInt(e.target.value) === USER_SELECTION_MULTIPLE)
        {
            for (let p of document.getElementsByClassName("profile"))
            {
                if (currentUser.length <= 1 && p.classList.contains("selected")) {
                    // This element is currently selected and it's the last one that is, we can't unselected it else we would have no current user
                    p.disabled = true;
                } else {
                    p.disabled = false;
                }
            }
        }
    });
    document.getElementById("user-type-selection-select").value = currentSelectionMode.toString();
}

let currentUser = null;
let currentSelectionMode;

export async function setSelectionMode(value)
{
    await filesystem.writePrefAsync("userSelection", value);
    currentSelectionMode = value;
}

export function getSelectionMode()
{
    return currentSelectionMode;
}

export async function setCurrentAltUser(value)
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