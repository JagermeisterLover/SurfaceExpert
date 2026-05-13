const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  loadFolders: () => ipcRenderer.invoke('load-folders'),
  saveItem: (folderName, item) => ipcRenderer.invoke('save-item', folderName, item),
  deleteItem: (folderName, itemName) => ipcRenderer.invoke('delete-item', folderName, itemName),
  createFolder: (folderName) => ipcRenderer.invoke('create-folder', folderName),
  renameFolder: (oldName, newName) => ipcRenderer.invoke('rename-folder', oldName, newName),
  deleteFolder: (folderName) => ipcRenderer.invoke('delete-folder', folderName),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  windowControl: (action) => ipcRenderer.send('window-control', action),
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', callback),
  onWindowUnmaximized: (callback) => ipcRenderer.on('window-unmaximized', callback),
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  openExternal: (url) => ipcRenderer.send('open-external', url)
});
