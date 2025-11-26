const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  openZMXDialog: () => ipcRenderer.invoke('open-zmx-dialog'),
  runConversion: (surfaceData, settings) => ipcRenderer.invoke('run-conversion', surfaceData, settings),
  saveConversionResults: (folderName, surfaceName, results) => ipcRenderer.invoke('save-conversion-results', folderName, surfaceName, results),
  loadFolders: () => ipcRenderer.invoke('load-folders'),
  saveSurface: (folderName, surface) => ipcRenderer.invoke('save-surface', folderName, surface),
  deleteSurface: (folderName, surfaceName) => ipcRenderer.invoke('delete-surface', folderName, surfaceName),
  createFolder: (folderName) => ipcRenderer.invoke('create-folder', folderName),
  renameFolder: (oldName, newName) => ipcRenderer.invoke('rename-folder', oldName, newName),
  deleteFolder: (folderName) => ipcRenderer.invoke('delete-folder', folderName),
  saveHTMLReport: (htmlContent, suggestedName) => ipcRenderer.invoke('save-html-report', htmlContent, suggestedName),
  generatePDFReport: (htmlContent, suggestedName) => ipcRenderer.invoke('generate-pdf-report', htmlContent, suggestedName),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  windowControl: (action) => ipcRenderer.send('window-control', action),
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', callback),
  onWindowUnmaximized: (callback) => ipcRenderer.on('window-unmaximized', callback),
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  openExternal: (url) => ipcRenderer.send('open-external', url)
});
