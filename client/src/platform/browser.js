async function readPrefAsync(key, def) {
    var match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    if (match) return match[2];
    return def;
}

async function writePrefAsync(key, value) {
    document.cookie = `${key}=${value}; max-age=34560000; path=/; SameSite=Strict`;
}

let canUseNotification = false;
function initBrowser() {
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
    
    compatibility = {
        notification: () => canUseNotification
    };
    versions = {
        node: () => null,
        chrome: () => navigator.userAgent,
        electron: () => null
    };
    interaction = {
        open: (url) => window.open(url, '_blank').focus()
    };
    filesystem = {
        readTokenAsync: async () => {
            var match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
            if (match) return match[2];
            return null;
        },
        writeTokenAsync: async (token) => {
            document.cookie = `token=${token}; max-age=2592000; path=/; SameSite=Strict`;
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
    notification = {
        isFocusedAsync: async () => document.hasFocus()
    };
}

if (typeof versions === 'undefined') {
    // If versions is undefined, it means we are on the browser version
    initBrowser();
}