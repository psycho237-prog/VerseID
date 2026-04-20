const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getApiKey: () => ipcRenderer.invoke('get-api-key'),
    setTrayIcon: (active) => ipcRenderer.send('set-tray-icon', active),
    notify: (data) => ipcRenderer.send('notify', data),
    closeApp: () => ipcRenderer.send('close-app'),
    detectVerse: (text) => ipcRenderer.invoke('detect-verse', text)
});

