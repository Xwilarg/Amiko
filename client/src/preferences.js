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

    // Notification settings
    document.getElementById("notification-selection-select").addEventListener("change", async e => {
        await setNotificationSettingsAsync(parseInt(e.target.value));
    });
    notificationSettings = parseInt(await filesystem.readPrefAsync("notification", NOTIF_SELECTION_PING));
    document.getElementById("notification-selection-select").value = notificationSettings.toString();

    document.getElementById("notification-privacy-selection-select").addEventListener("change", async e => {
        await setNotificationPrivacySettingsAsync(parseInt(e.target.value));
    });
    notificationPrivacySettings = parseInt(await filesystem.readPrefAsync("notifPrivacy", NOTIF_MODE_SHOW_ALL));
    document.getElementById("notification-privacy-selection-select").value = notificationPrivacySettings.toString();
}

let currentUser = null;
let currentSelectionMode;
let notificationSettings;
let notificationPrivacySettings;

export async function setSelectionModeAsync(value)
{
    await filesystem.writePrefAsync("userSelection", value);
    currentSelectionMode = value;
}

export function getSelectionMode()
{
    return currentSelectionMode;
}

export async function setNotificationSettingsAsync(value)
{
    await filesystem.writePrefAsync("notification", value);
    notificationSettings = value;
}

export function getNotificationSettings()
{
    return notificationSettings;
}

export async function setNotificationPrivacySettingsAsync(value)
{
    await filesystem.writePrefAsync("notifPrivacy", value);
    notificationPrivacySettings = value;
}

export function getNotificationPrivacySettings()
{
    return notificationPrivacySettings;
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

// Notification settings
export const NOTIF_SELECTION_NONE = 0;
export const NOTIF_SELECTION_PING = 1;
export const NOTIF_SELECTION_ALL = 2;

export const NOTIF_MODE_SHOW_ALL = 0;
export const NOTIF_MODE_HIDE_ALL = 1;