const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isPackaged = app.isPackaged;
let exeDir;
if (isPackaged) {
  exeDir = path.dirname(process.execPath);
} else {
  exeDir = app.getAppPath();
}

const portableDataDir = path.join(exeDir, 'AppData');

const logFile = path.join(exeDir, 'app-debug.log');
const logMessages = [];
let logFileReady = false;

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logMessages.push(logMessage + '\n');
  if (logFileReady) {
    try { fs.appendFileSync(logFile, logMessage + '\n', 'utf-8'); } catch (_) {}
  }
};

const flushLog = () => {
  if (logMessages.length > 0 && !logFileReady) {
    try {
      fs.writeFileSync(logFile, logMessages.join(''), 'utf-8');
      logFileReady = true;
    } catch (err) {
      try {
        const logDir = path.dirname(logFile);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
          fs.writeFileSync(logFile, logMessages.join(''), 'utf-8');
          logFileReady = true;
        }
      } catch (_) {}
    }
  }
};

log('=== App Startup ===');
log(`Packaged: ${isPackaged}`);
log(`Exe directory: ${exeDir}`);
log(`Data directory: ${portableDataDir}`);

try {
  if (!fs.existsSync(portableDataDir)) {
    fs.mkdirSync(portableDataDir, { recursive: true });
    log(`Created data directory: ${portableDataDir}`);
  }
  const testFile = path.join(portableDataDir, '.write-test');
  fs.writeFileSync(testFile, 'test', 'utf-8');
  fs.unlinkSync(testFile);
  log('Data directory is writable');
} catch (err) {
  log(`Failed to set up data directory: ${err.message}`);
}

app.setPath('userData', portableDataDir);
flushLog();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#2b2b2b',
    show: false,
    icon: path.join(__dirname, '..', 'icons', process.platform === 'win32' ? 'IconInvertedNoBGGlow.ico' : 'IconInvertedNoBGGlow.png'),
    frame: false,
    titleBarStyle: 'hidden'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => { mainWindow.show(); });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.on('maximize', () => { mainWindow.webContents.send('window-maximized'); });
  mainWindow.on('unmaximize', () => { mainWindow.webContents.send('window-unmaximized'); });

  Menu.setApplicationMenu(null);
  setupIpcHandlers();
}

function setupIpcHandlers() {
  const userDataPath = app.getPath('userData');
  const itemsDir = path.join(userDataPath, 'items');
  const settingsPath = path.join(userDataPath, 'settings.json');

  ipcMain.on('window-control', (event, action) => {
    switch (action) {
      case 'minimize': mainWindow.minimize(); break;
      case 'maximize':
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
        break;
      case 'close': mainWindow.close(); break;
    }
  });

  ipcMain.on('toggle-devtools', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });

  ipcMain.on('open-external', (event, url) => { shell.openExternal(url); });

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('load-settings', async () => {
    try {
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        return { success: true, settings: JSON.parse(content) };
      }
      return { success: true, settings: { theme: 'Dark Gray (Default)', locale: 'en' } };
    } catch (err) {
      return { success: false, error: err.message, settings: { theme: 'Dark Gray (Default)', locale: 'en' } };
    }
  });

  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  if (!fs.existsSync(itemsDir)) {
    try { fs.mkdirSync(itemsDir, { recursive: true }); } catch (err) { log(`Failed to create items dir: ${err.message}`); }
  }

  ipcMain.handle('load-folders', async () => {
    try {
      const folders = [];
      const entries = fs.readdirSync(itemsDir, { withFileTypes: true });
      const folderDirs = entries.filter(e => e.isDirectory());

      if (folderDirs.length === 0) {
        const defaultFolderPath = path.join(itemsDir, 'My Items');
        fs.mkdirSync(defaultFolderPath, { recursive: true });
        return { success: true, folders: [{ id: 'My Items', name: 'My Items', expanded: true, items: [] }] };
      }

      for (const folderDir of folderDirs) {
        const folderPath = path.join(itemsDir, folderDir.name);
        const items = [];
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
        for (const jsonFile of files) {
          try {
            const content = fs.readFileSync(path.join(folderPath, jsonFile), 'utf-8');
            items.push(JSON.parse(content));
          } catch (err) { log(`Error loading ${jsonFile}: ${err.message}`); }
        }
        folders.push({ id: folderDir.name, name: folderDir.name, expanded: true, items });
      }

      return { success: true, folders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-item', async (event, folderName, item) => {
    try {
      const folderPath = path.join(itemsDir, folderName);
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
      const sanitizedName = item.name.replace(/[<>:"/\\|?*]/g, '_');
      fs.writeFileSync(path.join(folderPath, `${sanitizedName}.json`), JSON.stringify(item, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-item', async (event, folderName, itemName) => {
    try {
      const sanitizedName = itemName.replace(/[<>:"/\\|?*]/g, '_');
      const filePath = path.join(itemsDir, folderName, `${sanitizedName}.json`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-folder', async (event, folderName) => {
    try {
      const folderPath = path.join(itemsDir, folderName);
      if (fs.existsSync(folderPath)) return { success: false, error: 'Folder already exists' };
      fs.mkdirSync(folderPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('rename-folder', async (event, oldName, newName) => {
    try {
      const oldPath = path.join(itemsDir, oldName);
      const newPath = path.join(itemsDir, newName);
      if (!fs.existsSync(oldPath)) return { success: false, error: 'Folder does not exist' };
      if (fs.existsSync(newPath)) return { success: false, error: 'Target folder name already exists' };
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-folder', async (event, folderName) => {
    try {
      const folderPath = path.join(itemsDir, folderName);
      if (!fs.existsSync(folderPath)) return { success: false, error: 'Folder does not exist' };
      fs.rmSync(folderPath, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

app.whenReady().then(() => {
  log('App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
