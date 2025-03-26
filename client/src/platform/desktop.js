const { contextBridge, shell, ipcRenderer } = require('electron');
const fs = require('node:fs');

async function readPrefAsync(key, def) {
    const path = (await ipcRenderer.invoke('path')) + "/settings.json";
    if (!fs.existsSync(path)) return def;
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    if (key in data) return data[key];
    return def;
}

async function writePrefAsync(key, value) {
    const path = (await ipcRenderer.invoke('path')) + "/settings.json";
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({key: value}));
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    data[key] = value;
    fs.writeFileSync(path, JSON.stringify(data));
}

contextBridge.exposeInMainWorld('compatibility', {
    notification: () => true
});
contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});
contextBridge.exposeInMainWorld('interaction', {
    open: (url) => shell.openExternal(url)
});
contextBridge.exposeInMainWorld('filesystem', {
    readTokenAsync: async () => {
        const path = (await ipcRenderer.invoke('path')) + "/token.dat";
        if (!fs.existsSync(path)) return null;
        return fs.readFileSync(path, 'utf8');
    },
    writeTokenAsync: async (token) => {
        const path = (await ipcRenderer.invoke('path')) + "/token.dat";
        fs.writeFileSync(path, token);
    },
    readPrefAsync: readPrefAsync,
    writePrefAsync: writePrefAsync,
    readPrefArrayAsync: async (key) => {
        return await readPrefAsync(key, []);
    },
    writePrefArrayAsync: async (key, values) => {
        await await writePrefArray(key, values)
    }
});
contextBridge.exposeInMainWorld('notification', {
    isFocusedAsync: async () => {
        return ipcRenderer.invoke('isFocused');
    },
});