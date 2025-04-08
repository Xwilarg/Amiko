function updateStyle(newVal: string) {
    document.getElementById("user-style")!.setAttribute("href", `./css/options/${newVal}.css`);
}

export async function preferences_initAsync() {
    // Style selection (which CSS we use)
    document.getElementById("style-selection-select")!.addEventListener("change", async e=> {
        const newVal = (e.target as HTMLInputElement).value;
        updateStyle(newVal);
        // @ts-ignore
        await filesystem.writePrefAsync("style", newVal);
    });
    // @ts-ignore
    const style = await filesystem.readPrefAsync("style", "regular");
    (document.getElementById("style-selection-select") as HTMLInputElement).value = style;
    updateStyle(style);

    // Current user
    // @ts-ignore
    const cU: string[] = await filesystem.readPrefArrayAsync("users");
    currentUser = cU.map(x => parseInt(x));

    // How we do user selection
    // @ts-ignore
    currentSelectionMode = parseInt(await filesystem.readPrefAsync("userSelection", UserSelectionMode.Single));
    (document.getElementById("user-type-selection-select") as HTMLInputElement).value = currentSelectionMode.toString();

    // Notification settings
    document.getElementById("notification-selection-select")!.addEventListener("change", async e => {
        await setNotificationPingModeAsync(parseInt((e.target as HTMLInputElement).value));
    });
    // @ts-ignore
    notificationPingMode = parseInt(await filesystem.readPrefAsync("notification", NotificationPingMode.PingOnly));
    (document.getElementById("notification-selection-select") as HTMLInputElement).value = notificationPingMode.toString();

    document.getElementById("notification-privacy-selection-select")!.addEventListener("change", async e => {
        await setNotificationPrivacySettingsAsync(parseInt((e.target as HTMLInputElement).value));
    });
    // @ts-ignore
    notificationDisplayMode = parseInt(await filesystem.readPrefAsync("notifPrivacy", NotificationDisplayMode.ShowAll));
    (document.getElementById("notification-privacy-selection-select") as HTMLInputElement).value = notificationDisplayMode.toString();

}

let currentUser: number[] | null = null;
let currentSelectionMode: UserSelectionMode;
let notificationPingMode: NotificationPingMode;
let notificationDisplayMode: NotificationDisplayMode;

export async function setSelectionModeAsync(value: UserSelectionMode)
{
    // @ts-ignore
    await filesystem.writePrefAsync("userSelection", value);
    currentSelectionMode = value;
}

export function getSelectionMode(): UserSelectionMode
{
    return currentSelectionMode;
}

export async function setNotificationPingModeAsync(value: NotificationPingMode)
{
    // @ts-ignore
    await filesystem.writePrefAsync("notification", value);
    notificationPingMode = value;
}

export function getNotificationSettings(): NotificationPingMode
{
    return notificationPingMode;
}

export async function setNotificationPrivacySettingsAsync(value: NotificationDisplayMode)
{
    // @ts-ignore
    await filesystem.writePrefAsync("notifPrivacy", value);
    notificationDisplayMode = value;
}

export function getNotificationPrivacySettings(): NotificationDisplayMode
{
    return notificationDisplayMode;
}

export async function setCurrentAltUserAsync(value: number[])
{
    // @ts-ignore
    await filesystem.writePrefArrayAsync("users", value);
    currentUser = value;
}

export function getCurrentAltUser(): number[] | null
{
    return currentUser;
}

export enum UserSelectionMode {
    Single,
    Multiple
}

export enum NotificationPingMode {
    None,
    PingOnly,
    All
}

export enum NotificationDisplayMode {
    ShowAll,
    HideAll
}