const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  openZMXDialog: () => ipcRenderer.invoke('open-zmx-dialog')
});
