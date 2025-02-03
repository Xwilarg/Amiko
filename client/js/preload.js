const { contextBridge } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});
contextBridge.exposeInMainWorld('os', {
    hostname: () => os.hostname()
});