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
    const websites: string[] = await filesystem.readPrefArrayAsync("websites");
    for (let website of websites) {
        // @ts-ignore
        const data = (await filesystem.readPrefArrayAsync(`users-${website}`)).map((x: string) => parseInt(x));
        currentUser[website] = data.length === 0 ? null : data;
    }

    // How we do user selection
    // @ts-ignore
    currentSelectionMode = parseInt(await filesystem.readPrefAsync("userSelection", UserSelectionMode.Single));
    (document.getElementById("user-type-selection-select") as HTMLInputElement).value = currentSelectionMode.toString();

    // Notification settings
    document.getElementById("notification-selection-select")!.addEventListener("change", async e => {
        await preferences_setNotificationPingModeAsync(parseInt((e.target as HTMLInputElement).value));
    });
    // @ts-ignore
    notificationPingMode = parseInt(await filesystem.readPrefAsync("notification", NotificationPingMode.PingOnly));
    (document.getElementById("notification-selection-select") as HTMLInputElement).value = notificationPingMode.toString();

    document.getElementById("notification-privacy-selection-select")!.addEventListener("change", async e => {
        await preferences_setNotificationDisplayModeAsync(parseInt((e.target as HTMLInputElement).value));
    });
    // @ts-ignore
    notificationDisplayMode = parseInt(await filesystem.readPrefAsync("notifPrivacy", NotificationDisplayMode.ShowAll));
    (document.getElementById("notification-privacy-selection-select") as HTMLInputElement).value = notificationDisplayMode.toString();

}

// Users for each website
let currentUser: { [website: string]: number[] | null; } = {};

// Settings global to the website
let currentSelectionMode: UserSelectionMode;
let notificationPingMode: NotificationPingMode;
let notificationDisplayMode: NotificationDisplayMode;

export async function preferences_setUserSelectionModeAsync(value: UserSelectionMode)
{
    // @ts-ignore
    await filesystem.writePrefAsync("userSelection", value);
    currentSelectionMode = value;
}

export function preferences_getUserSelectionMode(): UserSelectionMode
{
    return currentSelectionMode;
}

export async function preferences_setNotificationPingModeAsync(value: NotificationPingMode)
{
    // @ts-ignore
    await filesystem.writePrefAsync("notification", value);
    notificationPingMode = value;
}

export function preferences_getNotificationPingMode(): NotificationPingMode
{
    return notificationPingMode;
}

export async function preferences_setNotificationDisplayModeAsync(value: NotificationDisplayMode)
{
    // @ts-ignore
    await filesystem.writePrefAsync("notifPrivacy", value);
    notificationDisplayMode = value;
}

export function preferences_getNotificationDisplayMode(): NotificationDisplayMode
{
    return notificationDisplayMode;
}

export async function preferences_setCurrentAltUserAsync(website: string, value: number[])
{
    // @ts-ignore
    await filesystem.writePrefArrayAsync(`users-${website}`, value);
    currentUser[website] = value;
}

export function preferences_getCurrentAltUser(website: string): number[] | null
{
    return website in currentUser ? currentUser[website] : null;
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