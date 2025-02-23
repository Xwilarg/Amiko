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
        readAsync: async () => {
            var match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
            if (match) return match[2];
        },
        writeAsync: async (token) => {
            document.cookie = `token=${token}; max-age=2592000; path=/; SameSite=Strict`;
        }
    };
    notification = {
        isFocusedAsync: async () => document.hasFocus()
    };
}

if (typeof versions === 'undefined') {
    // If versions is unefined, it means we are on the browser version
    initBrowser();
}