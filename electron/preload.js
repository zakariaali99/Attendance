const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Platform info
    platform: process.platform,
    
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Window controls (if needed in future)
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    
    // Log from renderer
    log: (message) => console.log('[Electron]', message),
    
    // Notify main process
    notify: (channel, data) => ipcRenderer.send(channel, data),
    
    // Listen for messages from main
    on: (channel, callback) => {
        const validChannels = ['update-available', 'download-progress', 'install-update'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    }
});

// Log that preload script is running
console.log('Preload script loaded successfully');