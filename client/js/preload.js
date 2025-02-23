const { contextBridge, shell, ipcRenderer } = require('electron');
const fs = require('node:fs');

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});
contextBridge.exposeInMainWorld('interaction', {
    open: (url) => shell.openExternal(url)
});
contextBridge.exposeInMainWorld('filesystem', {
    readAsync: async () => {
        const path = (await ipcRenderer.invoke('path')) +  + "/token.dat";
        if (!fs.existsSync(path)) return null;
        return fs.readFileSync(path, 'utf8');
    },
    writeAsync: async (token) => {
        const path = (await ipcRenderer.invoke('path')) +  + "/token.dat";
        fs.writeFileSync(path, token);
    }
});