async function readPrefAsync(key, def) {
    var match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    if (match) return match[2];
    return def;
}

async function writePrefAsync(key, value) {
    document.cookie = `${key}=${value}; max-age=34560000; path=/; SameSite=Strict`;
}

let canUseNotification = false;
try
{
    window.Notification.requestPermission().then(function (permission) {
        console.log(`Notification perm status: ${permission}`);
    });
    canUseNotification = true;
}
catch
{
    console.warn("Notification API not available");
}

navigator.permissions.query({ name: "clipboard-read" }).then((result) => {
    console.log(`Clipboard perm status: ${result.state}`);
    if (result.state === "prompt") { // Show prompt right away so no need to ask in the future
        navigator.clipboard.read();
    }
});
    
window.compatibility = {
    notification: () => canUseNotification,
    crossorigin: () => false
};
window.versions = {
    node: () => null,
    chrome: () => navigator.userAgent,
    electron: () => null
};
window.interaction = {
    open: (url) => window.open(url, '_blank').focus()
};
window.configuration = {
    baseUrl: () => window.location.origin.startsWith("http://localhost")
        ? `http://localhost:5129` // Used for local debugging
        : window.location.origin
};
window.filesystem = {
    readTokenAsync: async () => {
        const pref = await readPrefAsync("websites", "");
        if (pref === "") return {};

        let data = {};
        for (let website of pref.split(','))
        {
            data[website] = await readPrefAsync(`website-${website}`, "");
        }
        return data;
    },
    writeTokenAsync: async (token, website) => {
        const pref = await readPrefAsync("websites", "");
        let websites;
        if (pref === "") websites = [];
        else websites = pref.split(',');

        if (!websites.includes("website")) {
            websites.push(website);
        }

        await writePrefAsync("websites", websites.join(','));
        await writePrefAsync(`website-${website}`, token);
    },
    readPrefAsync: readPrefAsync,
    writePrefAsync: writePrefAsync,
    readPrefArrayAsync: async (key) => {
        const pref = await readPrefAsync(key, "");
        if (pref === "") return [];
        return pref.split(",");
    },
    writePrefArrayAsync: async (key, values) => {
        await writePrefAsync(key, values.join(","));
    }
};
window.notification = {
    isFocusedAsync: async () => document.hasFocus()
};