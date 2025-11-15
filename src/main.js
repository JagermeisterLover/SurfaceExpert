const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

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
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
  setupIpcHandlers();
}

function setupIpcHandlers() {
  // Handler for opening ZMX file dialog
  ipcMain.handle('open-zmx-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Zemax Files', extensions: ['zmx', 'ZMX'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { canceled: true };
    }

    try:
      const filePath = result.filePaths[0];
      const content = fs.readFileSync(filePath, 'utf-8');
      return { canceled: false, content, filePath };
    } catch (error) {
      return { canceled: true, error: error.message };
    }
  });

  // Handler for running surface conversion
  ipcMain.handle('run-conversion', async (event, surfaceData, settings) => {
    const { spawn } = require('child_process');
    const tempDir = path.join(__dirname, '..');

    try {
      // Write surface data to temp file
      const dataContent = surfaceData.map(p => `${p.r}\t${p.z}`).join('\n');
      fs.writeFileSync(path.join(tempDir, 'tempsurfacedata.txt'), dataContent);

      // Write settings to file
      const settingsContent = Object.keys(settings).map(key => `${key}=${settings[key]}`).join('\n');
      fs.writeFileSync(path.join(tempDir, 'ConvertSettings.txt'), settingsContent);

      // Spawn Python process
      const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
      const scriptPath = path.join(__dirname, 'surfaceFitter.py');

      return new Promise((resolve, reject) => {
        const python = spawn(pythonPath, [scriptPath], {
          cwd: tempDir
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python script failed: ${stderr}`));
            return;
          }

          try {
            // Read fit report
            const fitReportPath = path.join(tempDir, 'FitReport.txt');
            const fitReportContent = fs.readFileSync(fitReportPath, 'utf-8');
            const fitReport = parseFitReport(fitReportContent);

            // Read metrics
            const metricsPath = path.join(tempDir, 'FitMetrics.txt');
            const metricsContent = fs.readFileSync(metricsPath, 'utf-8');
            const metrics = parseMetrics(metricsContent);

            resolve({
              success: true,
              fitReport,
              metrics,
              stdout
            });
          } catch (error) {
            reject(new Error(`Failed to read results: ${error.message}`));
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });
}

function parseFitReport(content) {
  const report = {};
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('=')) {
      const [key, value] = line.split('=');
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (trimmedKey === 'Type') {
        report[trimmedKey] = trimmedValue;
      } else {
        report[trimmedKey] = parseFloat(trimmedValue);
      }
    }
  }

  return report;
}

function parseMetrics(content) {
  const metrics = {};
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('=')) {
      const [key, value] = line.split('=');
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (trimmedValue === 'True') {
        metrics[trimmedKey] = true;
      } else if (trimmedValue === 'False') {
        metrics[trimmedKey] = false;
      } else {
        const numValue = parseFloat(trimmedValue);
        metrics[trimmedKey] = isNaN(numValue) ? trimmedValue : numValue;
      }
    }
  }

  return metrics;
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Surface',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-surface');
          }
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-action', 'open');
          }
        },
        {
          label: 'Import from ZMX...',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-action', 'import-zmx');
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save-as');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Surface',
      submenu: [
        {
          label: 'Add Surface',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            mainWindow.webContents.send('menu-action', 'add-surface');
          }
        },
        {
          label: 'Remove Surface',
          accelerator: 'Delete',
          click: () => {
            mainWindow.webContents.send('menu-action', 'remove-surface');
          }
        },
        { type: 'separator' },
        {
          label: 'Duplicate Surface',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('menu-action', 'duplicate-surface');
          }
        }
      ]
    },
    {
      label: 'Calculate',
      submenu: [
        {
          label: 'Recalculate All',
          accelerator: 'F5',
          click: () => {
            mainWindow.webContents.send('menu-action', 'recalculate');
          }
        },
        {
          label: 'Export Results...',
          click: () => {
            mainWindow.webContents.send('menu-action', 'export-results');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-action', 'open-settings');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            mainWindow.webContents.send('menu-action', 'documentation');
          }
        },
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('menu-action', 'about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
