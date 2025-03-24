async function readPrefAsync(key, def) {
    var match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    if (match) return match[2];
    return def;
}

async function writePrefAsync(key, value) {
    document.cookie = `${key}=${value}; max-age=34560000; path=/; SameSite=Strict`;
}

function initBrowser() {
    Notification.requestPermission().then(function (permission) {
        console.log(`Permission status: ${permission}`);
    });
    
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